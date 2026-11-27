export const instanceLabels = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const threshold = 0.5;

export function validateReference(rows: unknown, width: number, height: number): asserts rows is string[] {
    if (!Array.isArray(rows) || rows.length !== height || rows.some(row =>
        typeof row !== "string" || row.length !== width || Array.from(row).some(c => !(".?" + instanceLabels).includes(c))
    )) throw new Error("La referencia debe coincidir con el tamaño del PNG y usar etiquetas válidas.");
}

export function score(reference: string[], predictions: number[][]) {
    const labels = reference.join("");
    const sizes = new Map<string, number>();
    for (const label of labels) {
        if (instanceLabels.includes(label)) sizes.set(label, (sizes.get(label) ?? 0) + 1);
    }
    const overlap = predictions.map((pixels, prediction) => {
        const counts = new Map<string, number>();
        let area = 0;
        for (const index of pixels) {
            const label = labels[index];
            if (label === "?") continue;
            area++;
            if (sizes.has(label)) counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        return { prediction, area, links: Array.from(counts, ([label, intersection]) => ({
            label, intersection, iou: intersection / (area + sizes.get(label)! - intersection),
        })) };
    });
    // Find maximum-cardinality one-to-one matches. Prefer higher IoU on each search.
    const candidates = overlap.map(row => row.links.filter(edge => edge.iou >= threshold)
        .sort((a,b) => b.iou - a.iou || a.label.localeCompare(b.label)));
    const owner = new Map<string, number>();
    function match(prediction: number, seen: Set<string>): boolean {
        for (const {label} of candidates[prediction]) {
            if (seen.has(label)) continue;
            seen.add(label);
            const previous = owner.get(label);
            if (previous === undefined || match(previous, seen)) {
                owner.set(label, prediction);
                return true;
            }
        }
        return false;
    }
    for (const row of overlap) match(row.prediction, new Set());
    const matches = Array.from(owner, ([label, prediction]) => ({
        label, prediction, iou: candidates[prediction].find(link => link.label === label)!.iou,
    }));
    const used = new Set(owner.values());
    const missed = [...sizes.keys()].filter(label => !owner.has(label));
    const extra = overlap.filter(row => row.area > 0 && !used.has(row.prediction)).map(row => row.prediction);
    const merges = overlap.filter(row => row.links.length > 1).map(row => row.prediction);
    const fragments = [...sizes.keys()].filter(label => overlap.filter(row => row.links.some(edge => edge.label === label)).length > 1);
    return { expected: sizes.size, matches, missed, extra, merges, fragments, overlap };
}
