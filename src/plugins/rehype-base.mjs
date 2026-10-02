// Préfixe la base du site (BASE_PATH) aux liens et images absolus des
// articles Markdown/MDX : le contenu s'écrit `/uploads/x.jpg` ou
// `/fr/contact/`, et reste valide que le site soit servi sous `/comima/`
// (github.io) ou à la racine (domaine comima.mg).

const ATTRS = new Set(['src', 'href', 'poster']);

function prefix(value, base) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return value;
  if (base === '' || value === base || value.startsWith(`${base}/`)) return value;
  return `${base}${value}`;
}

function walk(node, base) {
  // Éléments HTML issus du Markdown.
  if (node.type === 'element' && node.properties) {
    for (const key of ATTRS) {
      if (key in node.properties) node.properties[key] = prefix(node.properties[key], base);
    }
  }
  // Balises JSX écrites à la main dans les .mdx (<img src="…" />).
  if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.attributes) {
    for (const attr of node.attributes) {
      if (attr.type === 'mdxJsxAttribute' && ATTRS.has(attr.name)) attr.value = prefix(attr.value, base);
    }
  }
  if (node.children) for (const child of node.children) walk(child, base);
}

export default function rehypeBase({ base = '/' } = {}) {
  const clean = base.replace(/\/$/, '');
  return (tree) => walk(tree, clean);
}
