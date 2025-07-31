import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function extractWebsiteText(url) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new", // Ensures proper headless mode on Render
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set a real user-agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for dynamic content
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const text = await page.evaluate(() => {
      const unwantedTags = [
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "HEADER",
        "FOOTER",
        "NAV",
        "FORM",
      ];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let content = "";

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentNode;

        if (
          node.nodeValue &&
          node.nodeValue.trim().length > 40 &&
          parent &&
          !unwantedTags.includes(parent.tagName) &&
          parent.offsetHeight > 0 &&
          parent.offsetWidth > 0
        ) {
          content += node.nodeValue.trim() + "\n";
        }
      }

      return content;
    });

    console.log("🔍 Extracted text length:", text.length);

    if (!text || text.trim().length < 30) {
      throw new Error("Website content too short or failed to extract");
    }

    return text;
  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}
