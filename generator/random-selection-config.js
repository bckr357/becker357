window.MTG_RANDOM_SELECTION_CONFIG = {
    default: {
        taskCount: 17,
        targetTypeCount: 16,
        atMostOnePickChance: 0.1,
        requiredTypes: [
            'einheiten',
            'prozentrechnung',
            'zehnerpotenzen_multiplizieren_dividieren',
            'kongruenz',
            'schriftliche_addition_subtraktion',
            'schriftliche_multiplikation_division',
            'termtabellen'
        ],
        exactOneGroups: [
            [
                'ganze_zahlen_addieren_subtrahieren',
                'ganze_zahlen_multiplizieren_dividieren'
            ], 
            [
                'dezimalbrueche_addieren_subtrahieren',
                'dezimalbrueche_multiplizieren_dividieren'
            ], 
            [
                'natuerliche_zahlen_addieren_subtrahieren',
                'natuerliche_zahlen_multiplizieren_dividieren'
            ]
        ],
        atMostOneGroups: [
            [
                'additionstabellen',
                'subtraktionstabellen',
                'multiplikationstabellen'
            ]
        ],
        defaultWeight: 1,
        weights: {
            einheiten: 2,
            schriftliche_addition_subtraktion: 0,
            schriftliche_multiplikation_division: 0,
            additionstabellen: 0,
            subtraktionstabellen: 0,
            multiplikationstabellen: 0,
            termtabellen: 0,
            kongruenz: 0
        }
    },
    grades: {
        '5': {},
        '6': {},
        '7': {},
        '8': {},
        '9': {},
        '10': {}
    }
};
