const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("when loggged in, can see blog create blog", async () => {
    const label = await page.getContentOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("and using valid input", () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("submiting task takes using to review screen", async () => {
      const text = await page.getContentOf("h5");

      expect(text).toEqual("Please confirm your entries");
    });

    test("submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      const title = await page.getContentOf(".card-title");
      const content = await page.getContentOf("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });

  describe("when entering invalid input", () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("the form shows error messages", async () => {
      const titleError = await page.getContentOf(".title .red-text");
      const contentError = await page.getContentOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("user is not logged in", () => {
  test("user can not create blog posts", async () => {
    const result = await page.post("/api/blogs", {
      title: "My Other Title",
      content: "My Other Content",
    });

    expect(result).toEqual({ error: "You must log in!" });
  });

  test("user can not retreive list of blog posts", async () => {
    const result = await page.get("/api/blogs");

    expect(result).toEqual({ error: "You must log in!" });
  });

  test("blog related actions are prohibited", async () => {
    const actions = [
      {
        method: "get",
        path: "/api/blogs",
      },
      {
        method: "post",
        path: "/api/blogs",
        data: {
          title: "T",
          content: "C",
        },
      },
    ];

    const results = await page.execRequests(actions);

    for (const result of results)
      expect(result).toEqual({ error: "You must log in!" });
  });
});
