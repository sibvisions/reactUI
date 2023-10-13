// Funktion zum Sortieren der Komponenten nach ihrer Top- und Left-Position
export function quickSort(components: { top: number, left: number, name: string }[], low: number, high: number): void {
    if (low < high) {
        // Finden des Trennelements (Pivot)
        let pivotIndex: number = partition(components, low, high);

        // Rekursiv die beiden Hälften sortieren
        quickSort(components, low, pivotIndex - 1);
        quickSort(components, pivotIndex + 1, high);
    }
}

// Hilfsfunktion zum Aufteilen des Arrays und Finden des Pivot-Index
function partition(components: { top: number, left: number, name: string }[], low: number, high: number): number {
    // Verwende das letzte Element als Pivot
    let pivot: { top: number, left: number, name: string } = components[high];
    let i: number = low - 1;

    for (let j: number = low; j < high; j++) {
        // Vergleiche die Top-Positionen
        if (components[j].top <= pivot.top) {
            i++;

            // Tausche die Positionen
            let temp: { top: number, left: number, name: string } = components[i];
            components[i] = components[j];
            components[j] = temp;
        } else if (components[j].top === pivot.top) {
            // Wenn die Top-Positionen gleich sind, vergleiche die Left-Positionen
            if (components[j].left <= pivot.left) {
                // Tausche die Positionen
                i++;
                let temp: { top: number, left: number, name: string } = components[i];
                components[i] = components[j];
                components[j] = temp;
            }
        }
    }

    // Tausche das Pivot-Element mit dem Element am (i+1)-ten Index
    let temp: { top: number, left: number, name: string } = components[i + 1];
    components[i + 1] = components[high];
    components[high] = temp;

    // Gib den Index des Pivot-Elements zurück
    return i + 1;
}