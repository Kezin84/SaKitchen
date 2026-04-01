const xlsx = require('xlsx');
const path = require('path');
const google = require('googlethis');

const options = {
  page: 0, 
  safe: false, 
  additional_params: { 
    hl: 'vi' 
  }
};

async function processExcel() {
  try {
    const filePath = path.resolve('..', 'Nhập hàng.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read data
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // The first row is headers: ["tên", "giá", "dvt", "link ảnh"]
    const headers = data[0];
    let imgColIndex = headers.indexOf('link ảnh');
    if (imgColIndex === -1 && headers.includes('dvt')) {
      imgColIndex = headers.indexOf('dvt') + 1;
      headers.splice(imgColIndex, 0, 'link ảnh'); // insert column
    } else if (imgColIndex === -1) {
      imgColIndex = headers.length;
      headers.push('link ảnh');
    }

    console.log(`Starting to fetch images for ${data.length - 1} items...`);

    let changes = 0;

    for (let i = 1; i < data.length; i++) {
        let keyword = data[i][0];
        if (!keyword) continue;
        
        // Skip if already has an image link
        if (data[i][imgColIndex] && typeof data[i][imgColIndex] === 'string' && data[i][imgColIndex].startsWith('http')) {
            continue;
        }

        console.log(`Searching for: ${keyword}`);
        try {
            const images = await google.image(keyword + " món ăn ngon", options);
            if (images && images.length > 0) {
                // Find a viable URL
                let url = images[0].url;
                data[i][imgColIndex] = url;
                console.log(`Found: ${url}`);
                changes++;
            } else {
                console.log("No images found.");
            }
        } catch (err) {
            console.error(`Error searching image for ${keyword}: ${err.message}`);
        }
        
        // Delay to prevent rate limit and save progress every 10 items
        await new Promise(res => setTimeout(res, 2000));
        
        if (changes > 0 && changes % 10 === 0) {
            console.log("Saving intermediate progress...");
            const newSheet = xlsx.utils.aoa_to_sheet(data);
            workbook.Sheets[sheetName] = newSheet;
            xlsx.writeFile(workbook, filePath);
        }
    }

    // Write back to excel finally
    if (changes > 0) {
       const newSheetFinal = xlsx.utils.aoa_to_sheet(data);
       workbook.Sheets[sheetName] = newSheetFinal;
       xlsx.writeFile(workbook, filePath);
       console.log("Done saving to Excel.");
    }
  } catch (e) {
    console.error(e);
  }
}

processExcel();
