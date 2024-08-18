async function searchArchive({ rows = 13, page = 1, sort = 'publicdate asc', collection = 'pub_economist', startDate, endDate }) {
    const collectionFilter = collection ? `collection:"${collection}"` : '';
    const dateFilter = startDate && endDate ? `date:[${startDate} TO ${endDate}]` : '';
    const filters = [collectionFilter, dateFilter, 'format:pdf'].filter(Boolean).join(' AND '); // Added filter for PDF format
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(filters)}&fl[]=identifier&sort[]=${encodeURIComponent(sort)}&rows=${rows}&page=${page}&output=json`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        return data.response.docs;
    } catch (error) {
        console.error('Error fetching data from Archive.org:', error);
    }
}

async function getItemMetadata(identifier: string) {
    const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;

    try {
        const response = await fetch(metadataUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching metadata from Archive.org:', error);
    }
}

const historyStartDate = '1900-01-01';
const historyEndDate = '2000-01-01';

const today = new Date().toISOString().split('T')[0];
const startReadingDate = '2024-08-01'; // Hypothetical start date for reading, feel free to change

const weeks = Math.ceil((+new Date(today) - +new Date(startReadingDate)) / (1000 * 60 * 60 * 24 * 7));

const navigatedMonths = weeks * 3
const historyNavigatedMonths = new Date(historyStartDate);
historyNavigatedMonths.setMonth(historyNavigatedMonths.getMonth() + navigatedMonths);
const historyNavigatedDate = historyNavigatedMonths.toISOString().split('T')[0];

const historyNavigatedDatePlus3Months = new Date(historyNavigatedDate);
historyNavigatedDatePlus3Months.setMonth(historyNavigatedDatePlus3Months.getMonth() + 3);
const historyNavigatedDatePlus3MonthsDate = historyNavigatedDatePlus3Months.toISOString().split('T')[0];

console.log('Start reading date (Hypothetical):', startReadingDate);
console.log('Weeks passed:', weeks);
console.log('Current history range:', historyNavigatedDate, 'to', historyNavigatedDatePlus3MonthsDate);

searchArchive({ startDate: historyNavigatedDate, endDate: historyNavigatedDatePlus3MonthsDate }).then(results => {
    // choose on randomly from the 3 months range
    const result = results[Math.floor(Math.random() * results.length)];

    // Get metadata for the randomly selected item
    if (result) {
        const itemIdentifier = result.identifier;
        getItemMetadata(itemIdentifier).then(({ metadata, files }) => {
            if (metadata) {
                const { title } = metadata;
                const pdfFiles = files.filter(file => file.format === 'Text PDF');
                
                console.log('Title:', title);
                console.log('Link:', `https://archive.org/details/${itemIdentifier}`);
                // TODO: we can spin up a summarization LLM to summarize the content of the text field in archive.org api response 
                const pdfLink = `https://archive.org/download/${itemIdentifier}/${pdfFiles[0].name}`;
                console.log('PDF Link:', pdfLink);
            } else {
                console.log('Metadata not available for this item.');
            }
        });
    } else {
        console.log('No results found for the given date range.');
    }
});
