const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
});

afterEach(async () => {
  await page.close();
});

test("the header has the correct text", async () => {
  const text = await page.getContentOf("a.brand-logo");
  expect(text).toEqual("Blogster");
});

test("clicking on login starts the oauth flow", async () => {
  await page.click(".right a");
  const url = page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test("when signed in, show logout button", async () => {
  await page.login();

  const text = await page.getContentOf("a[href='/auth/logout']");

  expect(text).toEqual("Logout");
});
