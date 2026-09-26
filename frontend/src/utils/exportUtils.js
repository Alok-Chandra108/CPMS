export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) {
    return;
  }

  // Get headers
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof val === 'string') {
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const exportToPDF = async (data, title = 'Report', filename = 'report.pdf') => {
  if (!data || !data.length) {
    return;
  }

  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Get headers for table
  const headers = Object.keys(data[0]);
  
  // Format data for autotable
  const body = data.map(row => headers.map(header => row[header]));

  doc.autoTable({
    startY: 35,
    head: [headers],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 10 }
  });

  doc.save(filename);
};

/**
 * Downloads a remote file (such as a Cloudinary PDF) directly to the user's computer
 * @param {string} url - Direct URL to the file
 * @param {string} defaultFilename - Name to save the file as
 */
export const downloadRemoteFile = async (url, defaultFilename = 'document.pdf') => {
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Direct download failed, falling back to direct link:', error);
    // Cloudinary attachment fallback or open in new tab
    const downloadUrl = url.includes('/upload/')
      ? url.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(defaultFilename.replace(/\.[^/.]+$/, ''))}/`)
      : url;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
