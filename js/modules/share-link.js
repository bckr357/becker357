// Kompakte URL-Codierung fuer vorausgewaehlte Aufgabentypen.
// Die IDs kommen aus einer stabilen, anwendungsbezogenen Registry und sind
// unabhaengig von der Reihenfolge der sichtbaren typeDefinitions.
window.MTGShareLinkModule = {
    createCodec(typeRegistry) {
        const keyToIndex = new Map();
        const indexToKey = [];

        if (Array.isArray(typeRegistry)) {
            typeRegistry.forEach((key, index) => {
                keyToIndex.set(key, index);
                indexToKey[index] = key;
            });
        } else {
            Object.entries(typeRegistry || {}).forEach(([key, index]) => {
                if (!Number.isInteger(index) || index < 0 || keyToIndex.has(key) || indexToKey[index]) {
                    throw new Error(`MTG: Ungueltige oder doppelte Share-Link-ID fuer "${key}".`);
                }
                keyToIndex.set(key, index);
                indexToKey[index] = key;
            });
        }

        const maxIndex = indexToKey.length - 1;

        const encode = types => {
            const bytes = new Uint8Array(Math.ceil((maxIndex + 1) / 8));
            for (const type of types) {
                const index = keyToIndex.get(type);
                if (index === undefined) continue;
                bytes[Math.floor(index / 8)] |= 1 << (index % 8);
            }

            let lastNonZero = bytes.length - 1;
            while (lastNonZero >= 0 && bytes[lastNonZero] === 0) {
                lastNonZero--;
            }
            if (lastNonZero < 0) return '';

            const trimmedBytes = bytes.subarray(0, lastNonZero + 1);
            let binary = '';
            for (const byte of trimmedBytes) binary += String.fromCharCode(byte);
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const decode = value => {
            if (typeof value !== 'string' || !value || value === '0') return [];

            try {
                const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
                const binary = atob(normalized);
                const selected = [];

                for (let index = 0; index <= maxIndex; index++) {
                    const byte = binary.charCodeAt(Math.floor(index / 8)) || 0;
                    if (byte & (1 << (index % 8)) && indexToKey[index]) {
                        selected.push(indexToKey[index]);
                    }
                }

                return selected;
            } catch (error) {
                console.warn('MTG: Ungueltige Aufgabentypen-Codierung in der URL.', error);
                return [];
            }
        };

        const read = urlLike => {
            try {
                const url = new URL(urlLike, window.location.href);
                const rawGradeStr = url.searchParams.get('c') || url.searchParams.get('klasse') || url.searchParams.get('grade');
                const rawGrade = Number(rawGradeStr);
                const grade = Number.isInteger(rawGrade) && rawGrade >= 5 && rawGrade <= 10
                    ? rawGrade
                    : null;

                const tParam = url.searchParams.get('t');
                let types = [];
                if (tParam) {
                    types = decode(tParam);
                } else {
                    const plainTypesParam = url.searchParams.get('typen') || url.searchParams.get('types');
                    if (plainTypesParam) {
                        const candidates = plainTypesParam.split(',').map(s => s.trim()).filter(Boolean);
                        types = candidates.filter(type => keyToIndex.has(type));
                    }
                }

                const rawTaskCount = Number(url.searchParams.get('n'));
                const taskCount = Number.isInteger(rawTaskCount) && rawTaskCount >= 1 && rawTaskCount <= 300
                    ? rawTaskCount
                    : null;
                const rawArrangement = url.searchParams.get('a');
                const arrangement = ['ordered', 'random', 'random-ordered'].includes(rawArrangement)
                    ? rawArrangement
                    : null;
                const rawPagesParam = url.searchParams.get('p');
                const rawPages = Number(rawPagesParam);
                const pages = rawPagesParam === null
                    ? null
                    : Number.isInteger(rawPages) && [1, 2].includes(rawPages)
                        ? rawPages
                        : 1;
                const worksheetTitle = url.searchParams.get('h')
                    ?? url.searchParams.get('title')
                    ?? url.searchParams.get('ueberschrift');

                return { grade, types, taskCount, arrangement, pages, worksheetTitle };
            } catch (error) {
                console.warn('MTG: Fehler beim Lesen der URL.', error);
                return { grade: null, types: [], taskCount: null, arrangement: null, pages: null, worksheetTitle: null };
            }
        };

        const write = (urlLike, { grade, types, taskCount, arrangement, pages, worksheetTitle }) => {
            const url = new URL(urlLike, window.location.href);
            url.searchParams.delete('klasse');
            url.searchParams.delete('grade');
            url.searchParams.delete('typen');
            url.searchParams.delete('types');
            url.searchParams.delete('title');
            url.searchParams.delete('ueberschrift');

            if (Number.isInteger(grade) && grade >= 5 && grade <= 10) {
                url.searchParams.set('c', String(grade));
            } else {
                url.searchParams.delete('c');
            }

            if (Array.isArray(types) && types.length > 0) {
                const encoded = encode(types);
                if (encoded) {
                    url.searchParams.set('t', encoded);
                } else {
                    url.searchParams.delete('t');
                }
            } else {
                url.searchParams.delete('t');
            }

            if (Number.isInteger(taskCount) && taskCount >= 1 && taskCount <= 300) {
                url.searchParams.set('n', String(taskCount));
            } else {
                url.searchParams.delete('n');
            }

            if (['ordered', 'random', 'random-ordered'].includes(arrangement)) {
                url.searchParams.set('a', arrangement);
            } else {
                url.searchParams.delete('a');
            }

            if (Number.isInteger(pages) && [1, 2].includes(pages)) {
                url.searchParams.set('p', String(pages));
            } else {
                url.searchParams.delete('p');
            }

            const normalizedTitle = typeof worksheetTitle === 'string'
                ? worksheetTitle.trim()
                : '';
            if (normalizedTitle) {
                url.searchParams.set('h', normalizedTitle);
            } else {
                url.searchParams.delete('h');
            }

            return url;
        };

        return { read, write };
    }
};
