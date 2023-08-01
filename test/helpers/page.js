const puppeteer = require("puppeteer");

const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

let browserOpts = {
  headless: false,
};

if (process.env.CHROMIUM_PATH) {
  browserOpts = { ...browserOpts, executablePath: process.env.CHROMIUM_PATH };
}

const baseUrl = "http://localhost:3000";

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch(browserOpts);

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    await customPage.gotoBaseUrl();

    return new Proxy(customPage, {
      get(target, prop) {
        return target[prop] || browser[prop] || page[prop];
      },
    });
  }

  constructor(page) {
    this.page = page;
  }

  async gotoBaseUrl() {
    await this.page.goto(baseUrl);
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    await this.page.goto(`${baseUrl}/blogs`);
    await this.page.waitFor("a[href='/auth/logout']");
  }

  async getContentOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  async get(path) {
    return await this.page.evaluate(async (_path) => {
      return await fetch(_path, {
        method: "GET",
        credential: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
    }, path);
  }

  async post(path, data) {
    return await this.page.evaluate(
      async (_path, _data) => {
        return await fetch(_path, {
          method: "POST",
          credential: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        }).then((res) => res.json());
      },
      path,
      data
    );
  }

  async execRequests(actions) {
    return await Promise.all(
      actions.map(async ({ method, path, data }) => {
        return await this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
