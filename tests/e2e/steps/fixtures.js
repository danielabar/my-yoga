import { test as base, createBdd } from "playwright-bdd";

export const test = base;
export const expect = base.expect;

export const { Given, When, Then } = createBdd(test);
