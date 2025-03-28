export function convertToJson(inputString: string) {
    // Remove newline characters and extra whitespaces
    const formattedString = inputString
        .replace(/\\n/g, '')  // Remove newline escapes
        .replace(/\\"/g, '"')  // Convert escaped double quotes to normal quotes
        .replace(/\(\s*/g, '{') // Replace opening parentheses with a curly brace
        .replace(/\)\s*/g, '}') // Replace closing parentheses with a curly brace
        .replace(/\s*content:\s*/g, '"content": ')  // Add quotes around content key
        .replace(/\s*personality:\s*/g, '"personality": ')  // Add quotes around personality key
        .replace(/(\w+):/g, '"$1":')  // Add quotes around personality keys

    try {
        const parsedJson = JSON.parse(formattedString);  // Parse the formatted string into JSON
        return parsedJson;  // Return the resulting JSON object
    } catch (error) {
        console.error('Error parsing the string:', error);
        return null;
    }
}

