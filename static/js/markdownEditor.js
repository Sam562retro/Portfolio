const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true
});

function updatePreview() {
    const markdownText = editor.value;
    let htmlText = marked.parse(markdownText);
    preview.innerHTML = htmlText;
    updateWordCount();
}

function updateWordCount() {
    const text = editor.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text.split('\n').length;

    document.getElementById('charCount').textContent = `${chars} characters`;
    document.getElementById('wordCount').textContent = `${words} words`;
    document.getElementById('lineCount').textContent = `${lines} lines`;
}

function insertText(before, after = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const replacement = before + selectedText + after;

    editor.value = editor.value.substring(0, start) + replacement + editor.value.substring(end);

    // Set cursor position
    const newStart = start + before.length;
    const newEnd = newStart + selectedText.length;
    editor.focus();
    editor.setSelectionRange(newStart, newEnd);

    updatePreview();
}

function insertHeading(level) {
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = editor.value.indexOf('\n', start);
    const line = editor.value.substring(lineStart, lineEnd === -1 ? editor.value.length : lineEnd);

    const headingPrefix = '#'.repeat(level) + ' ';
    const newLine = line.replace(/^#+\s*/, '') || 'Heading';
    const replacement = headingPrefix + newLine;

    editor.value = editor.value.substring(0, lineStart) + replacement + editor.value.substring(lineEnd === -1 ? editor.value.length : lineEnd);

    editor.focus();
    editor.setSelectionRange(lineStart + headingPrefix.length, lineStart + replacement.length);
    updatePreview();
}

function insertLink() {
    const selectedText = getSelectedText();
    const linkText = selectedText || 'Link text';
    const url = prompt('Enter URL:', 'https://');
    if (url) {
        insertText(`[${linkText}](${url})`);
    }
}

function insertImage() {
    const altText = prompt('Enter alt text:', 'Image description');
    const url = prompt('Enter image URL:', 'https://');
    if (url && altText) {
        insertText(`![${altText}](${url})`);
    }
}

function insertTable() {
    const table = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

`;
    insertText(table);
}

function getSelectedText() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    return editor.value.substring(start, end);
}

// Handle keyboard shortcuts
editor.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'b':
                e.preventDefault();
                insertText('**', '**');
                break;
            case 'i':
                e.preventDefault();
                insertText('*', '*');
                break;
            case 's':
                e.preventDefault();
                saveContent();
                break;
        }
    }
});

// Initialize
updatePreview();

function goBack() {
    // Check if there's any unsaved content
    const hasContent = editor.value.trim() !== '' ||
                      document.getElementById('blogTitle').value.trim() !== '' ||
                      document.getElementById('blogCategory').value.trim() !== '';

    // Use browser's back functionality
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback - redirect to a default page or close
        window.location.href = '/'; // Change this to your desired back destination
    }
}
