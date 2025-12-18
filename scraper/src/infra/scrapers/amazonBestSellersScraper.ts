import type { Browser, Page } from "puppeteer"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { Product } from "../../models/productModel.ts"
import type { CatalogScraperProvider } from "../../providers/catalogScraperProvider.ts"
import type { ProductRepository } from "../../repositories/productRepository.ts"

puppeteer.use(StealthPlugin())

type Category = {
  name: string
  url: string
}

export class AmazonBestSellersScraper implements CatalogScraperProvider {
  async scrape(productsRepository: ProductRepository): Promise<void> {
    const { page, browser } = await openBrowser()

    try {
      await page.goto("https://www.amazon.com.br/gp/bestsellers", { waitUntil: "domcontentloaded" })
    } catch (_error) {
      console.log("Erro ao carregar página inicial, possível timeout ou bloqueio.")
      await browser.close()
      return
    }

    if (await isThrottled(page)) {
      console.error("BLOQUEADO: Amazon detectou bot. Tente trocar de IP ou aguardar.")
      await browser.close()
      return
    }

    const categories = await getCategories(page, browser)

    console.log(`categorias encontradas: ${categories.length}`)

    for (const [index, category] of categories.entries()) {
      let attempt = 0
      let processed = false

      while (!processed && attempt < 3) {
        attempt += 1

        try {
          await page.goto(category.url, { waitUntil: "domcontentloaded" })

          if (await isThrottled(page)) {
            console.error(`BLOQUEADO na categoria ${category.name}. Aguardando antes de seguir.`)
            await delay()
            break
          }

          await scrollPage(page)

          await page.waitForSelector("[data-asin]", { timeout: 30_000 })
          const isGiftCategory = category.name.toLowerCase().includes("gift")
          if (!isGiftCategory) {
            await page.waitForFunction(
              () =>
                document.querySelector("._cDEzb_p13n-sc-price_3mJ9Z") ||
                document.querySelector(".a-price .a-offscreen"),
              { timeout: 15_000 },
            )
          } else {
            // Gift Cards às vezes não apresentam preço com os seletores padrões; não bloquear o fluxo.
            try {
              await page.waitForFunction(
                () =>
                  document.querySelector("._cDEzb_p13n-sc-price_3mJ9Z") ||
                  document.querySelector(".a-price .a-offscreen"),
                { timeout: 7_000 },
              )
            } catch (_ignored) {
              // segue mesmo sem encontrar preço.
            }
          }

          const topProducts = await scrapeTopProducts(page, category, isGiftCategory)
          if (isGiftCategory && topProducts.length === 0) {
            console.warn("Gift Cards sem produtos identificados; pulando categoria.")
            processed = true
            break
          }

          validateProducts(topProducts)
          await productsRepository.saveMany(topProducts)
          processed = true
        } catch (_error) {
          console.error(`erro ao coletar produtos em ${category.name}, tentativa ${attempt}`)
          if (attempt >= 3) {
            break
          }
          await page.reload({ waitUntil: "domcontentloaded" })
          await delay()
        }
      }

      console.log(`categoria ${category.name} finalizada ${index + 1}/${categories.length}`)
      await delay()
    }

    await browser.close()

    console.log(`Todos produtos foram salvos com sucesso`)
    return
  }
}

async function openBrowser(): Promise<{ page: Page; browser: Browser }> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
  })

  const page = await browser.newPage()
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

  const session = await page.createCDPSession()
  await session.send("Network.setUserAgentOverride", {
    userAgent,
    platform: "Windows",
  })

  await page.setExtraHTTPHeaders({
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  })

  return { page, browser }
}

async function isThrottled(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return (
      document.title.includes("Sorry") ||
      document.querySelector("pre")?.textContent?.trim() ===
        "Request was throttled. Please wait a moment and refresh the page"
    )
  })
}

async function getCategories(page: Page, browser: Browser): Promise<Category[]> {
  try {
    await page.waitForSelector(
      "div[id^='CardInstance'] ul._p13n-zg-nav-tree-all_style_zg-browse-root__-jwNv a",
      { timeout: 15_000 },
    )
  
    return page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          "div[id^='CardInstance'] ul._p13n-zg-nav-tree-all_style_zg-browse-root__-jwNv a",
        ),
      )
      return links
        .map((link) => ({
          name: link.textContent?.trim() ?? "",
          url: new URL(link.getAttribute("href") ?? "", location.href).href,
        }))
        .filter((item) => item.name.length > 0 && item.url.length > 0)
    })
  } catch (_error) {
    await browser.close()
    throw new Error("Não foi possível carregar as categorias. Pode ser um CAPTCHA ou layout diferente.")
  }
}

async function scrollPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0
      const distance = 10
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight / 2) {
          clearInterval(timer)
          resolve()
        }
      }, 10)
    })
  })
}

const delay = () => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (2_000 - 1_000 + 1) + 1_000)))

type RawScraped = {
  name: string
  price: number
  image: string
  url: string
  category: string
  rank: number
}

async function scrapeTopProducts(page: Page, category: Category, isGiftCategory: boolean): Promise<Product[]> {
  await delay()

  try {
    await page.waitForSelector("[data-asin]:not([data-asin='']) img", { timeout: 15_000 })
  } catch (_error) {
    console.log(`Timeout esperando produtos na categoria: ${category.name}`)
    return []
  }

  const rawProducts = (await page.evaluate(
    (categoryName: string, isGift: boolean) => {
    const titleSelectors = [
      "div[class*='p13n-sc-css-line-clamp']",
      "._cDEzb_p13n-sc-css-line-clamp-5_2l-dX",
      "._cDEzb_p13n-sc-css-line-clamp-3_g3dy1",
      "._cDEzb_p13n-sc-css-line-clamp-2_EWgCb",
      "._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y",
      "._cDEzb_p13n-sc-css-line-clamp-2",
      "h2 a span",
      "a.a-link-normal span",
      "span.a-size-medium",
    ]

    const cardsLimit = isGift ? 1 : 3
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-asin]:not([data-asin=''])"),
    ).slice(0, cardsLimit)

    return cards.map((card, index) => {
      const title =
        titleSelectors
          .map((selector) => card.querySelector(selector)?.textContent?.trim() ?? "")
          .find((value) => value.length > 0) ?? ""

      const price =
        card.querySelector("._cDEzb_p13n-sc-price_3mJ9Z")?.textContent?.trim() ??
        card.querySelector(".a-price .a-offscreen")?.textContent?.trim() ??
        card.querySelector(".a-color-price")?.textContent?.trim() ??
        ""

      const imageUrl = card.querySelector<HTMLImageElement>("img")?.src ?? ""
      const href = card.querySelector<HTMLAnchorElement>("a.a-link-normal")?.getAttribute("href") ?? ""
      const productUrl = href ? new URL(href, location.href).href : ""

      return {
        name: title,
        price: Number(price.replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".")),
        image: imageUrl,
        url: productUrl,
        category: categoryName,
        rank: index + 1,
      }
    })
    },
    category.name,
    isGiftCategory,
  )) as RawScraped[]

  const safeProducts = Array.isArray(rawProducts) ? rawProducts : []

  return safeProducts.map(
    (item) =>
      new Product({
        name: item.name,
        price: item.price,
        image: item.image,
        url: item.url,
        category: item.category,
        rank: item.rank,
      }),
  )
}

function validateProducts(products: Product[]): void {
  if (products.length === 0) {
    throw new Error("lista de produtos vazia")
  }
  
  const invalid = products.find(
    (product) =>
      product.props.name.trim().length === 0 ||
      product.props.image.trim().length === 0 ||
      product.props.url.trim().length === 0 ||
      Number.isNaN(product.props.price)
  )

  
  if (invalid) {
    console.log(products)
    throw new Error("produto com dados incompletos")
  }
}
