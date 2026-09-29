import pkg from "../../package.json";

/** The one place the site's version comes from: package.json. Footer, About page and home page read it here. */
export const VERSION: string = pkg.version;

/** ICP filing number, shown in the footer once the filing is approved (set ICP_NUMBER in the environment). */
export const ICP_NUMBER = process.env.ICP_NUMBER ?? "";

/** Where readers send feedback, corrections and suggestions. Shown in the footer, About page and under comments. */
export const FEEDBACK_EMAIL = "620026600@qq.com";
