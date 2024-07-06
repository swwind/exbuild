use swc_core::ecma::ast::{ExportAll, ImportDecl, NamedExport, Str};
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{ast::Program, visit::VisitMut};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

pub struct AdjustImportsVisitor;

fn adjust_import_source(s: &Str) -> Str {
    let name = s.value.to_string();
    if name.starts_with("./") || name.starts_with("../") {
        return Str::from(format!(
            "{}.mjs",
            name.trim_end_matches(".tsx").trim_end_matches(".ts")
        ));
    } else {
        s.clone()
    }
}

impl VisitMut for AdjustImportsVisitor {
    fn visit_mut_import_decl(&mut self, n: &mut ImportDecl) {
        n.src = Box::new(adjust_import_source(&n.src));
    }

    fn visit_mut_export_all(&mut self, n: &mut ExportAll) {
        n.src = Box::new(adjust_import_source(&n.src))
    }

    fn visit_mut_named_export(&mut self, n: &mut NamedExport) {
        n.src = n
            .src
            .as_ref()
            .and_then(|x| Some(Box::new(adjust_import_source(&x))))
    }
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    _metadata: TransformPluginProgramMetadata,
) -> Program {
    program.visit_mut_with(&mut AdjustImportsVisitor);

    program
}

#[cfg(test)]
mod test {
    use swc_core::ecma::{transforms::testing::test_inline, visit::as_folder};

    use crate::AdjustImportsVisitor;

    test_inline!(
        Default::default(),
        |_| as_folder(AdjustImportsVisitor),
        should_adjust_import_decl,
        r#"
        import { jsx0 } from "test";
        import { jsx1 } from "test.ts";
        import { jsx2 } from "test.tsx";
        import { jsx3 } from "./test";
        import { jsx4 } from "./test.ts";
        import { jsx5 } from "./test.tsx";
        import { jsx6 } from "../test";
        import { jsx7 } from "../test.ts";
        import { jsx8 } from "../test.tsx";
        "#,
        r#"
        import { jsx0 } from "test";
        import { jsx1 } from "test.ts";
        import { jsx2 } from "test.tsx";
        import { jsx3 } from "./test.mjs";
        import { jsx4 } from "./test.mjs";
        import { jsx5 } from "./test.mjs";
        import { jsx6 } from "../test.mjs";
        import { jsx7 } from "../test.mjs";
        import { jsx8 } from "../test.mjs";
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(AdjustImportsVisitor),
        should_adjust_export_named_decl,
        r#"
        export { jsx0 } from "test";
        export { jsx1 } from "test.ts";
        export { jsx2 } from "test.tsx";
        export { jsx3 } from "./test";
        export { jsx4 } from "./test.ts";
        export { jsx5 } from "./test.tsx";
        export { jsx6 } from "../test";
        export { jsx7 } from "../test.ts";
        export { jsx8 } from "../test.tsx";
        "#,
        r#"
        export { jsx0 } from "test";
        export { jsx1 } from "test.ts";
        export { jsx2 } from "test.tsx";
        export { jsx3 } from "./test.mjs";
        export { jsx4 } from "./test.mjs";
        export { jsx5 } from "./test.mjs";
        export { jsx6 } from "../test.mjs";
        export { jsx7 } from "../test.mjs";
        export { jsx8 } from "../test.mjs";
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(AdjustImportsVisitor),
        should_adjust_export_all,
        r#"
        export * from "test";
        export * from "test.ts";
        export * from "test.tsx";
        export * from "./test";
        export * from "./test.ts";
        export * from "./test.tsx";
        export * from "../test";
        export * from "../test.ts";
        export * from "../test.tsx";
        "#,
        r#"
        export * from "test";
        export * from "test.ts";
        export * from "test.tsx";
        export * from "./test.mjs";
        export * from "./test.mjs";
        export * from "./test.mjs";
        export * from "../test.mjs";
        export * from "../test.mjs";
        export * from "../test.mjs";
        "#
    );
}
