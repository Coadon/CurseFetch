import readline from 'readline';
import TC from "./termcolor.js";

export const RL = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

export async function prompt(question) {
    return new Promise((resolve) =>
        RL.question(question, (answer) => {
            resolve(answer);
        })
    );
}

export function trace(msg) {
    console.log(TC.FG_GRAY + msg + TC.RESET);
}

export function info(msg) {
    console.log(TC.RESET + msg + TC.RESET);
}

export function warn(msg) {
    console.log(TC.FG_YELLOW + msg + TC.RESET);
}

export function error(msg) {
    console.log(TC.FG_RED + msg + TC.RESET);
}
