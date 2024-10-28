import {JSX} from 'solid-js/jsx-runtime';

export function splitSegments(htmlString: string): Record<string, () => JSX.Element> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  removeUnwantedSections(doc);

  const h2Elements = doc.querySelectorAll('h2');
  const records: Record<string, () => JSX.Element> = {};

  h2Elements.forEach((h2) => {
    const sectionId: string = h2.textContent?.trim() || '';
    let sectionHtml: string = h2.outerHTML;
    let sibling = h2.nextElementSibling;

    while (sibling && sibling.tagName !== 'H2') {
      sectionHtml += sibling.outerHTML;
      sibling = sibling.nextElementSibling;
    }

    records[sectionId] = () => <div class="px-10 py-5" innerHTML={sectionHtml}></div>;
  });

  return records;
}

function removeUnwantedSections(doc: Document): string {
  const h2Elements = doc.querySelectorAll('h2');
  let tocFound = false;

  for (const h2 of Array.from(h2Elements)) {
    if (h2.id === 'core-concepts') {
      tocFound = true;
      // Remove everything above Core Concepts section
      let previous = h2.previousSibling;
      while (previous) {
        const prevNode = previous;
        previous = previous.previousSibling;
        prevNode.parentNode?.removeChild(prevNode);
      }
    }else if (h2.id === 'examples') {
      // Remove the examples section
      let sibling: ChildNode | null = h2;
      while (sibling && (sibling.nodeName !== 'H2' || sibling === h2)) {
        const nextSibling = sibling.nextSibling;
        sibling.parentNode?.removeChild(sibling);
        sibling = nextSibling;
      }
    }
  }

  if (!tocFound) throw new Error('Table of contents not found in HTML');

  return doc.body.innerHTML;
}
