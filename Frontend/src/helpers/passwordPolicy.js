const PASSWORD_REQUIREMENTS = [
    { id: 'length', test: (value) => [...value].length >= 8 },
    { id: 'uppercase', test: (value) => /\p{Lu}/u.test(value) },
    { id: 'lowercase', test: (value) => /\p{Ll}/u.test(value) },
    { id: 'special', test: (value) => /[^\p{L}\p{N}\s]/u.test(value) }
];

export function evaluatePasswordRequirements(password = '') {
    const value = String(password);
    return PASSWORD_REQUIREMENTS.map(({ id, test }) => ({
        id,
        met: test(value)
    }));
}

export function passwordMeetsRequirements(password = '') {
    return evaluatePasswordRequirements(password).every((requirement) => requirement.met);
}
