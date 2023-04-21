import { screen } from "@testing-library/react"

export function randString() {
    return Math.random().toString(20).substring(2, 10);
}

export function randDate() {
    return new Date(Math.pow(1000, 4) + Math.random() * Math.pow(1000, 4));
}

export function fmtDP(part: number, pad = 2) {
    return part.toString().padStart(pad, '0');
}

export function expectMirrorText(target: string) {
    return expect(screen.getByTestId(`${target}-mirror`).textContent);
}