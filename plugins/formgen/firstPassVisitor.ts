import type {IR} from "@hey-api/openapi-ts";

export class FirstPassVisitor {
  schemas: Map<string, IR.SchemaObject> = new Map();
  roots: Map<string, string> = new Map();
  weight: Map<string, number> = new Map();
  dependencies: Map<string, Set<string>> = new Map<string, Set<string>>();
  back_dependencies: Map<string, Set<string>> = new Map<string, Set<string>>();

  add(ref: string, schema: IR.SchemaObject) {
    this.schemas.set(ref, schema);
    // this.roots.set(ref, ref);
    // this.weight.set(ref, 1);
  }

  find(ref: string) {
    let root = ref;
    let grand_root = this.roots.get(ref);
    if (!grand_root) {
      this.roots.set(ref, ref);
      this.weight.set(ref, 1);
      return ref;
    }

    while (grand_root != root) {
      const next: string = this.roots.get(grand_root!)!;
      this.roots.set(root, grand_root!);
      root = grand_root!;
      grand_root = next;
    }
    return root;
  }

  union(base: string, dependency: string) {
    const deps = this.dependencies.get(base) || new Set();
    this.dependencies.set(base, deps);
    deps.add(dependency);

    const back_deps = this.back_dependencies.get(dependency) || new Set();
    this.back_dependencies.set(dependency, back_deps);
    back_deps.add(base);

    const root1 = this.find(base);
    const root2 = this.find(dependency);
    if (root1 == root2) {
      return;
    }

    if (!root1 || !root2) {
      debugger;
    }

    const weight1 = this.weight.get(root1)!;
    const weight2 = this.weight.get(root2)!;

    if (weight1 > weight2) {
      this.roots.set(root2, root1);
      this.weight.set(root1, weight1 + weight2);
      this.weight.set(root2, 0);
    } else {
      this.roots.set(root1, root2);
      this.weight.set(root2, weight1 + weight2);
      this.weight.set(root1, 0);
    }
  }

  extract(selected_roots: string[]) {
    const set = new Set(selected_roots.map(r => this.find(r)));
    const queue: string[] = [];
    const rc: Map<string, number> = new Map();

    for (const ref of this.roots.keys()) {
      if (set.has(this.find(ref))) {
        const deps = this.dependencies.get(ref);
        if (!deps || deps.size == 0) {
          queue.push(ref);
        } else {
          rc.set(ref, deps.size)
        }
      }
    }

    const result: string[] = [];

    while (queue.length > 0) {
      const ref = queue.shift()!;
      result.push(ref);
      const backs = this.back_dependencies.get(ref);
      if (backs) {
        for (const back of backs) {
          const back_rc = rc.get(back)!;
          if (back_rc == 1) {
            rc.delete(back);
            queue.push(back);
          } else {
            rc.set(back, back_rc - 1);
          }
        }
      }
    }
    if (rc.size > 0) {
      throw new Error("Circular dependency found " + [...rc.keys()]);
    }

    return result;
  }
}
