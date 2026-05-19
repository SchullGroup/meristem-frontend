/**
 * Triggers a browser download of a CSV template.
 * @param {Array<string>} fields - The list of column headers.
 * @param {string} fileName - The name of the file to be saved.
 */
export const downloadCsvTemplate = (
  fields: string[],
  fileName: string = "template.csv",
) => {
  // 1. Join the fields with commas to create the header row
  const csvContent = fields.join(",");

  // 2. Create a Blob with the CSV content and specify the MIME type
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // 3. Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);

  // 4. Create a hidden 'a' tag to trigger the download
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";

  // 5. Append to the document, click it, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a browser download of a CSV file.
 */
export const downloadCsvData = (
  headers: string[],
  rows: string[][],
  fileName: string = "data.csv",
) => {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
