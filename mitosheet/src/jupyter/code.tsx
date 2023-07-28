// Utilities for working with the generated code

import { PublicInterfaceVersion } from "../mito";

const IMPORT_STATEMENTS = [
    'from mitosheet.public.v1 import *',
    'from mitosheet.public.v2 import *',
    'from mitosheet.public.v3 import *',
]

export function getCodeString(
    analysisName: string,
    code: string[],
    telemetryEnabled: boolean,
    publicInterfaceVersion: PublicInterfaceVersion
): string {

    if (code.length == 0) {
        return '';
    }

    const finalCode = code.join('\n');

    // If telemetry not enabled, we want to be clear about this by
    // simply not calling a func w/ the analysis name
    let analysisRegisterCode = '';
    if (telemetryEnabled) {
        analysisRegisterCode = `register_analysis("${analysisName}");`
    } else {
        analysisRegisterCode = `# Analysis Name:${analysisName};`
    }

    return finalCode.replace(`mitosheet.public.v${publicInterfaceVersion} import *`, `mitosheet.public.v${publicInterfaceVersion} import *; ${analysisRegisterCode}`);
}


// Returns the last line with any non-whitespace character
export function getLastNonEmptyLine(codeText: string): string | undefined {
    const filteredActiveText = codeText.split(/\r?\n/).filter(line => line.trim().length > 0)
    return filteredActiveText.length > 0 ? filteredActiveText.pop() : undefined
}

export const getArgsFromMitosheetCallCode = (codeText: string): string[] => {
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText);
    let nameString = codeTextCleaned.split('sheet(')[1].split(')')[0];

    // If there is a (new) analysis name parameter passed, we ignore it
    if (nameString.includes('analysis_to_replay')) {
        nameString = nameString.split('analysis_to_replay')[0].trim();
    }

    // If there is a view_df name parameter, we ignore it
    // TODO: remove this on Jan 1, 2023 (since we no longer need it)
    if (nameString.includes('view_df')) {
        nameString = nameString.split('view_df')[0].trim();
    }

    if (nameString.includes('sheet_functions')) {
        nameString = nameString.split('sheet_functions')[0].trim();
    }

    // Get the args and trim them up
    let args = nameString.split(',').map(dfName => dfName.trim());
    
    // Remove any names that are empty. Note that some of these names
    // may be strings, which we turn into valid df_names on the backend!
    args = args.filter(dfName => {return dfName.length > 0});

    return args;
}


// Returns true iff a the given cell ends with a mitosheet.sheet call
export function isMitosheetCallCode(codeText: string): boolean {
    // Get the last non-empty line from the cell
    const lastLine = getLastNonEmptyLine(codeText);
    if (lastLine === undefined) {
        return false;
    }
    /* 
        We check if the last line contains a mitosheet.sheet call, which can happen in a few ways
        
        1. `import mitosheet` -> mitosheet.sheet()
        2. `import mitosheet as {THING}` -> {THING}.sheet(
        3. `from mitosheet import sheet` -> sheet(

        We detect all three by checking if the line contains `sheet(`!
    */

    const lastLineCleaned = removeWhitespaceInPythonCode(lastLine)
    return lastLineCleaned.indexOf('sheet(') !== -1;
}



// Returns true iff a the given cell is a cell containing the generated code
export function isMitoAnalysisCode(codeText: string): boolean {

    // Check if it starts with any import statement from the versioned interface
    let startsWithPublicVersionImport = false;
    IMPORT_STATEMENTS.forEach(importStatement => {
        if (codeText.startsWith(importStatement + '; register_analysis(' ) || codeText.startsWith(importStatement + '; # Analysis Name:' )) {
            startsWithPublicVersionImport = true;
        } 
    })

    // Handle the old and new Mito boilerplate code
    return codeText.startsWith('# MITO CODE START') 
        || codeText.startsWith('from mitosheet import *; register_analysis(')
        || codeText.startsWith('from mitosheet import *; # Analysis:')
        || codeText.startsWith('from mitosheet import *; # Analysis Name:')
        || startsWithPublicVersionImport
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithSpecificAnalysisToReplay(codeText: string, analysisName: string): boolean {
    // Remove any whitespace from codeText
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText);
    return codeTextCleaned.includes('sheet(') && codeTextCleaned.includes(`analysis_to_replay="${analysisName}"`)
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithAnyAnalysisToReplay(codeText: string): boolean {
    // Remove any whitespace from codeText
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText)
    return isMitosheetCallCode(codeText) && codeTextCleaned.includes(`analysis_to_replay=`)
}


/* 
    Returns true if the cell contains the code generated for a specific analysis name
*/
export function containsGeneratedCodeOfAnalysis(codeText: string, analysisName: string): boolean {
    return isMitoAnalysisCode(codeText) && codeText.includes(analysisName);
}

// Removes all whitespace from a string, except for whitespace in quoted strings.
export function removeWhitespaceInPythonCode(codeText: string): string {

    const pattern = /('[^']*'|"[^"]*")/;
    // This pattern matches:
    // 1. A single-quoted string containing any character except for '.
    // 2. OR a double-quoted string containing any character except for ".
    
    // Split the text into quoted strings and non-quoted sections.
    const parts = codeText.split(pattern);
    
    // Remove all whitespace from non-quoted sections.
    const partsWithoutSpaces = parts.map((part) => {
        if (pattern.test(part)) {
            return part; // Keep quoted strings unchanged.
        }
        return part.replace(/\s+/g, '');
    });
    
    // Join the parts back into a single string.
    const result = partsWithoutSpaces.join('');
    
    return result;
}
