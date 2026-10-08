import { describe, expect, it } from "vitest";
import { DESIGN_KINDS, HIERARCHY } from "../../content/hierarchy-patterns";
import { defaultState, type BuilderState } from "../prompt/state";
import { imageActor, newActor, type ImageUse } from "../scene/model";
import { basePlan, checkPlan, roleOf } from "./plan";

const SEYON = [
  "TRANSPORTATION • LOGISTICS • WAREHOUSING",
  "JOHOR • SINGAPORE • MALAYSIA",
  "JOHOR LOCAL TRIP • JOHOR ↔ SINGAPORE",
  "39A, Jalan Eko Botanik 3/4",
  "Taman Eko Botanik",
  "79100 Iskandar Puteri, Johor, Malaysia",
  "seyon_services@yahoo.com",
];

const withImages = (uses: (ImageUse | undefined)[], patch: Partial<BuilderState> = {}): BuilderState => {
  const actors = uses.reduce<BuilderState["actors"]>((all, use, i) => [...all, { ...imageActor({ key: `k${i}`, ratio: 1, use }, all), id: `img${i}` }], []);
  return { ...defaultState(), style: "blueprint", ...patch, actors: [...(patch.actors ?? []), ...actors] };
};

const seyon = withImages(["logo"], { format: "poster", subject: "a cargo truck", text: SEYON.join("\n") });

describe("reading-order priors from TASTE", () => {
  it("has reading-order priors for every design kind", () => {
    for (const kind of DESIGN_KINDS) {
      expect(HIERARCHY[kind].order.length).toBeGreaterThan(1);
      expect(new Set(HIERARCHY[kind].order).size).toBe(HIERARCHY[kind].order.length);
    }
    expect(HIERARCHY.other.briefs).toBeGreaterThan(0);
  });
});

describe("roleOf", () => {
  it("spots contact, call-to-action and offer lines", () => {
    expect(roleOf("39A, Jalan Eko Botanik 3/4")).toBe("contact");
    expect(roleOf("Taman Eko Botanik")).toBe("contact");
    expect(roleOf("79100 Iskandar Puteri, Johor, Malaysia")).toBe("contact");
    expect(roleOf("+60 12-345 6789")).toBe("contact");
    expect(roleOf("seyon_services@yahoo.com")).toBe("contact");
    expect(roleOf("www.seyon.my")).toBe("contact");
    expect(roleOf("Book now")).toBe("cta");
    expect(roleOf("Order today at the counter")).toBe("cta");
    expect(roleOf("20% off this week")).toBe("offer");
    expect(roleOf("RM 12")).toBe("offer");
    expect(roleOf("Sat 14 Nov, 8pm")).toBe("detail");
    expect(roleOf("14–16 March 2027")).toBe("detail");
    expect(roleOf("Doors 7:30 pm")).toBe("detail");
    expect(roleOf("Every Friday 7pm")).toBe("detail");
    expect(roleOf("KUALA LUMPUR JAZZ NIGHT")).toBeNull();
    expect(roleOf("Jazz Night Saturday")).toBeNull();
    expect(roleOf("TRANSPORTATION • LOGISTICS")).toBeNull();
    expect(roleOf("JOHOR • SINGAPORE • MALAYSIA")).toBeNull();
  });
});

describe("basePlan", () => {
  it("plans the Seyon flyer: headline first, logo as brand, contact details last", () => {
    const plan = basePlan(seyon);
    expect(plan).toMatchObject({ kind: "poster", layout: "free", source: "rules", message: null });
    expect(plan.items[0]).toMatchObject({ ref: SEYON[0], role: "headline", priority: 1, locked: "exact words" });
    expect(plan.items.find((i) => i.ref === "image 1")).toMatchObject({ kind: "image", role: "brand", priority: 2, locked: "reproduce exactly" });
    expect(plan.items.find((i) => i.ref === "a cargo truck")).toMatchObject({ kind: "subject", role: "hero", priority: 1, locked: null });
    expect(plan.items.find((i) => i.ref === SEYON[1])).toMatchObject({ role: "subhead", priority: 2 });
    expect(plan.items.find((i) => i.ref === "seyon_services@yahoo.com")).toMatchObject({ role: "contact", priority: 3 });
    // Every contact line sits after everything else.
    const roles = plan.items.map((i) => i.role);
    expect(roles.slice(roles.indexOf("contact"))).toEqual(["contact", "contact", "contact", "contact"]);
    // Each of the user's lines appears exactly once.
    expect(plan.items.filter((i) => i.kind === "words").map((i) => i.ref).sort()).toEqual([...SEYON].sort());
  });

  it("never makes the date the headline of an event poster", () => {
    const plan = basePlan({ ...defaultState(), format: "poster", text: "Sat 14 Nov, 8pm\nKUALA LUMPUR JAZZ NIGHT\nTickets at kljazz.com\nFree entry before 9pm" });
    expect(plan.items[0]).toMatchObject({ ref: "KUALA LUMPUR JAZZ NIGHT", role: "headline", priority: 1 });
    expect(plan.items.find((i) => i.ref === "Sat 14 Nov, 8pm")).toMatchObject({ role: "detail", priority: 3 });
  });

  it("treats a text-source picture as copy, the headline when nothing is typed", () => {
    const plan = basePlan(withImages(["logo", "text"], { format: "flyer" }));
    expect(plan.items.find((i) => i.ref === "words from image 2")).toMatchObject({ kind: "image", role: "headline", locked: "exact words" });
    // Flyers lead with the brand in the TASTE briefs.
    expect(plan.items[0]!.ref).toBe("image 1");
  });

  it("keeps faces and products as heroes, and leaves look-only pictures out", () => {
    const plan = basePlan(withImages(["face", "product", "look"]));
    expect(plan.items.map((i) => [i.ref, i.role, i.locked])).toEqual([
      ["image 1", "hero", "keep likeness"],
      ["image 2", "hero", "reproduce exactly"],
    ]);
  });

  it("marks placed text with its position lock", () => {
    const sign = newActor("text", "OPEN LATE", []);
    const plan = basePlan({ ...defaultState(), actors: [sign] });
    expect(plan.items).toEqual([{ ref: "OPEN LATE", kind: "words", role: "headline", priority: 1, locked: "exact words, placed position" }]);
  });

  it("is empty when there is nothing to plan, and marks a preserved restyle", () => {
    expect(basePlan({ ...defaultState(), subject: "" }).items).toEqual([]);
    const restyle = basePlan({ ...defaultState(), task: "restyle", preserve: ["composition"], subject: "a lighthouse" });
    expect(restyle.layout).toBe("preserve");
    expect(basePlan({ ...defaultState(), task: "restyle", preserve: [], subject: "a lighthouse" }).layout).toBe("free");
  });
});

describe("checkPlan", () => {
  const base = basePlan(seyon);
  const answer = (items = base.items.map(({ ref, role, priority }) => ({ ref, role: role as string, priority: priority as number }))) => ({
    message: "  Seyon Transport moves goods between Johor and Singapore.  ",
    items,
  });

  it("accepts a reordering with new roles, keeping the base locks and kinds", () => {
    const items = [...answer().items].reverse().map((i) => (i.ref === SEYON[2] ? { ...i, role: "headline", priority: 1 } : i));
    const plan = checkPlan(answer(items), base)!;
    expect(plan.source).toBe("ai");
    expect(plan.message).toBe("Seyon Transport moves goods between Johor and Singapore.");
    expect(plan.items[0]!.ref).toBe(base.items.at(-1)!.ref);
    expect(plan.items.find((i) => i.ref === SEYON[2])).toMatchObject({ role: "headline", priority: 1, locked: "exact words", kind: "words" });
    expect(plan.items.find((i) => i.ref === "image 1")).toMatchObject({ locked: "reproduce exactly", kind: "image" });
    expect(plan).toMatchObject({ kind: base.kind, layout: base.layout });
  });

  it("rejects an answer that drops, repeats or invents an item, or uses an unknown role or priority", () => {
    const items = answer().items;
    expect(checkPlan(answer(items.slice(1)), base)).toBeNull();
    expect(checkPlan(answer([...items, items[0]!]), base)).toBeNull();
    expect(checkPlan(answer([...items.slice(1), { ref: "FREE DELIVERY", role: "offer", priority: 2 }]), base)).toBeNull();
    expect(checkPlan(answer(items.map((i, n) => (n ? i : { ...i, role: "tagline" }))), base)).toBeNull();
    expect(checkPlan(answer(items.map((i, n) => (n ? i : { ...i, priority: 4 }))), base)).toBeNull();
  });

  it("caps a long message", () => {
    expect(checkPlan({ ...answer(), message: "x".repeat(400) }, base)!.message!.length).toBeLessThanOrEqual(160);
  });
});
