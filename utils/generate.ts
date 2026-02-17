import { v4 as uuidv4 } from 'uuid';
const generate = {

    barcodeId: () => {
        // Generate a UUID and convert to a 12-digit number
        const uuid = uuidv4().replace(/-/g, '');
        const numericString = uuid.replace(/[a-f]/gi, (char) => {
            return String(char.charCodeAt(0) - 87); // Convert a-f to 10-15
        });
        
        // Take first 12 digits and pad with zeros if needed
        const barcode = numericString.substring(0, 12).padStart(12, '0');
        
        return barcode;
    }
}

export default generate;