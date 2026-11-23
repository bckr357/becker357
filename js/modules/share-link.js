// Kompakte URL-Codierung fuer vorausgewaehlte Aufgabentypen.
// Die IDs kommen aus dem gemeinsamen taskTypeDefinitions-Katalog.
const MTG_SHARE_DEFAULT_GRADE = 10;
const MTG_SHARE_DEFAULT_TASK_COUNT = 20;

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
        const byteToBase64Url = bytes => {
            let binary = '';
            for (const byte of bytes) binary += String.fromCharCode(byte);
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };
        const base64UrlToBytes = value => {
            const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
            const binary = atob(normalized);
            return Uint8Array.from(binary, char => char.charCodeAt(0));
        };

        const encodeBitfield = types => {
            const bytes = new Uint8Array(Math.ceil((maxIndex + 1) / 8));
            for (const type of types) {
                const index = keyToIndex.get(type);
                if (index === undefined) continue;
                bytes[Math.floor(index / 8)] |= 1 << (index % 8);
            }
            let lastNonZero = bytes.length - 1;
            while (lastNonZero >= 0 && bytes[lastNonZero] === 0) lastNonZero--;
            if (lastNonZero < 0) return null;
            return bytes.subarray(0, lastNonZero + 1);
        };
        const encodeVarintList = types => {
            const ids = types.map(t => keyToIndex.get(t)).filter(i => i !== undefined).sort((a, b) => a - b);
            if (ids.length === 0) return null;
            const bytes = new Uint8Array(1 + ids.length);
            bytes[0] = ids.length;
            ids.forEach((id, i) => { bytes[i + 1] = id; });
            return bytes;
        };
        const encode = types => {
            if (!Array.isArray(types) || types.length === 0) return '';
            const bf = encodeBitfield(types);
            const vl = encodeVarintList(types);
            let chosen = null, header = 0;
            if (bf && (!vl || bf.length + 1 <= vl.length + 1)) { chosen = bf; header = 0; }
            else if (vl) { chosen = vl; header = 1; }
            if (!chosen) return '';
            const out = new Uint8Array(chosen.length + 1);
            out[0] = header;
            out.set(chosen, 1);
            return byteToBase64Url(out);
        };
        const decode = value => {
            if (typeof value !== 'string' || !value) return [];
            try {
                const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
                const binary = atob(normalized);
                const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
                if (bytes.length === 0) return [];
                const header = bytes[0];
                const payload = bytes.subarray(1);
                const selected = [];
                if (header === 0) {
                    for (let index = 0; index <= maxIndex; index++) {
                        const byte = payload[Math.floor(index / 8)] || 0;
                        if (byte & (1 << (index % 8)) && indexToKey[index]) selected.push(indexToKey[index]);
                    }
                } else if (header === 1) {
                    const count = payload[0] || 0;
                    for (let i = 1; i <= count && i < payload.length; i++) {
                        const id = payload[i];
                        if (indexToKey[id]) selected.push(indexToKey[id]);
                    }
                }
                return selected;
            } catch (error) {
                console.warn('MTG: Ungueltige Aufgabentypen-Codierung in der URL.', error);
                return [];
            }
        };

        const encodeWeights = weights => {
            const entries = [];

            for (const [type, rawWeight] of Object.entries(weights || {})) {
                const index = keyToIndex.get(type);
                const weight = Number(rawWeight);
                if (index === undefined || !Number.isInteger(weight) || weight < 0 || weight > 9) continue;
                if (weight !== 1) {
                    entries.push([index, weight]);
                }
            }

            if (entries.length === 0) return '';

            const bytes = new Uint8Array(entries.length * 2);
            entries.forEach(([index, weight], entryIndex) => {
                const packed = (index << 4) | weight;
                bytes[entryIndex * 2] = packed >> 8;
                bytes[entryIndex * 2 + 1] = packed & 0xff;
            });
            return `.${byteToBase64Url(bytes)}`;
        };

        const decodeSparseWeights = value => {
            if (!value.startsWith('.')) return null;

            const bytes = base64UrlToBytes(value.slice(1));
            if (bytes.length === 0 || bytes.length % 2 !== 0) {
                throw new Error('Ungueltige Sparse-Gewichtungs-Codierung.');
            }

            const weights = {};
            for (let offset = 0; offset < bytes.length; offset += 2) {
                const packed = (bytes[offset] << 8) | bytes[offset + 1];
                const index = packed >> 4;
                const weight = packed & 0x0f;
                if (!indexToKey[index] || weight > 9) continue;
                weights[indexToKey[index]] = weight;
            }
            return weights;
        };

        const decodeWeights = value => {
            if (typeof value !== 'string' || !value) return null;

            try {
                const sparseWeights = decodeSparseWeights(value);
                if (sparseWeights) return sparseWeights;

                const bytes = base64UrlToBytes(value);
                const weights = {};
                for (let index = 0; index <= maxIndex; index++) {
                    if (!indexToKey[index]) continue;
                    const byte = bytes[Math.floor(index / 2)];
                    const weight = byte === undefined
                        ? 1
                        : (byte >> (index % 2 ? 4 : 0)) & 0x0f;
                    if (weight > 9) continue;
                    weights[indexToKey[index]] = weight;
                }
                return weights;
            } catch (error) {
                console.warn('MTG: Ungueltige Gewichtungs-Codierung in der URL.', error);
                return null;
            }
        };

        const gradeToChar = { GS: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '0' };
        const charToGrade = { '4': 'GS', '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 10 };
        const arrToChar = { ordered: 'o', random: 'r', 'random-ordered': 'x' };
        const charToArr = { o: 'ordered', r: 'random', x: 'random-ordered' };

        const read = urlLike => {
            try {
                const url = new URL(urlLike, window.location.href);
                const taskMode = url.searchParams.has('c') ? 'calculator' : 'standard';
                let grade = null, arrangement = null, pages = null, presentationColumns = null, taskCount = null;
                const m = url.searchParams.get('m');
                if (m && m.length >= 4) {
                    grade = charToGrade[m[0]] ?? null;
                    arrangement = charToArr[m[1]] ?? null;
                    pages = Number(m[2]);
                    if (![1, 2].includes(pages)) pages = null;
                    presentationColumns = Number(m[3]);
                    if (![1, 2].includes(presentationColumns)) presentationColumns = null;
                    const tail = m.slice(4);
                    if (tail) {
                        const tc = Number(tail);
                        if (Number.isInteger(tc) && tc >= 1 && tc <= 300) taskCount = tc;
                    }
                }
                const tParam = url.searchParams.get('t');
                let types = [];
                if (tParam) types = decode(tParam);
                const worksheetTitle = url.searchParams.get('h');
                const weights = decodeWeights(url.searchParams.get('w'));
                return { grade, types, taskCount, arrangement, pages, presentationColumns, worksheetTitle: worksheetTitle || null, weights, taskMode };
            } catch (error) {
                console.warn('MTG: Fehler beim Lesen der URL.', error);
                return { grade: null, types: [], taskCount: null, arrangement: null, pages: null, presentationColumns: null, worksheetTitle: null, weights: null, taskMode: 'standard' };
            }
        };

        const write = (urlLike, {
            grade,
            types,
            taskCount,
            arrangement,
            pages,
            presentationColumns,
            worksheetTitle,
            weights,
            weightsEnabled,
            taskMode
        }) => {
            const url = new URL(urlLike, window.location.href);
            if (['http:', 'https:'].includes(url.protocol) && url.pathname.endsWith('/index.html')) {
                url.pathname = url.pathname.slice(0, -'index.html'.length);
            }
            url.searchParams.delete('view');
            url.searchParams.delete('klasse');
            url.searchParams.delete('grade');
            url.searchParams.delete('typen');
            url.searchParams.delete('types');
            url.searchParams.delete('title');
            url.searchParams.delete('ueberschrift');
            url.searchParams.delete('mode');
            url.searchParams.delete('c');
            url.searchParams.delete('m');
            url.searchParams.delete('n');
            url.searchParams.delete('a');
            url.searchParams.delete('p');
            url.searchParams.delete('col');

            // build m
            const isDefaultGrade = (grade === 10 || grade === '10' || grade === null);
            const gradeChar = gradeToChar[grade] ?? gradeToChar[MTG_SHARE_DEFAULT_GRADE];
            const arrChar = arrToChar[arrangement] ?? 'o';
            const pagesChar = String(pages ?? 2);
            const colsChar = String(presentationColumns ?? 2);
            const taskCountTail = (Number.isInteger(taskCount) && taskCount >= 1 && taskCount <= 300 && taskCount !== MTG_SHARE_DEFAULT_TASK_COUNT) ? String(taskCount) : '';
            const allDefault = isDefaultGrade && arrChar === 'o' && pagesChar === '2' && colsChar === '2' && taskCountTail === '';
            if (!allDefault) {
                url.searchParams.set('m', gradeChar + arrChar + pagesChar + colsChar + taskCountTail);
            }

            if (Array.isArray(types) && types.length > 0) {
                const encoded = encode(types);
                if (encoded) url.searchParams.set('t', encoded);
                else url.searchParams.delete('t');
            } else {
                url.searchParams.delete('t');
            }

            const normalizedTitle = typeof worksheetTitle === 'string' ? worksheetTitle.trim() : '';
            if (normalizedTitle) url.searchParams.set('h', normalizedTitle);
            else url.searchParams.delete('h');

            const selectedSet = new Set(Array.isArray(types) ? types : []);
            const filteredWeights = {};
            if (weights && typeof weights === 'object') {
                for (const [k, v] of Object.entries(weights)) {
                    if (selectedSet.size === 0 || selectedSet.has(k)) filteredWeights[k] = v;
                }
            }
            const encodedWeights = weightsEnabled ? encodeWeights(filteredWeights) : '';
            if (encodedWeights) url.searchParams.set('w', encodedWeights);
            else url.searchParams.delete('w');

            if (taskMode === 'calculator') {
                if (url.search && url.search !== '?') url.search += '&c';
                else url.search = '?c';
            }

            return url;
        };

        return { read, write };
    }
};
