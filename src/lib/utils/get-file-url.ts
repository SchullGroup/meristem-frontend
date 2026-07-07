// This is a utility function that push any pdf file to s3 and return a url that can be used to access the image anywhere. It accepts the file and folderName as parameters. The folderName is the name of the folder you want to upload to in s3.
// It's an async function, so you will need to await it wherever you are calling the function. Also if you are calling this GetImageUrl function inside another function, you will have to make it async too
import axios from "axios";

const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
            resolve(fileReader.result?.toString().split(",")[1] || "");
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
};
  
// folder name must not contain any symbols
export const GetPDFUrl = async (file: File, folderName: string) => {
  const fileName = file?.name;
  const convertToUrlAPI = `https://4c73wdutl4.execute-api.us-west-1.amazonaws.com/staging/fileupload/upload-file?fileName=${fileName}&projectFolder=${folderName}`;

  if (file?.size > 2000000) {
    return { type: 'error', result: 'File too large...' };
  }

  const base64 = await convertToBase64(file);

  const payload = { file: base64 };
  try {
        const response = await axios.post(convertToUrlAPI, payload);
      return { type: 'success', result: response.data.responseObj.pdf_url };
  } catch (error) {
      return { type: 'error', result: error };
    }
};


// SAMPLE USAGE OF THE FUNCTION IN A REACT CODE

// import {useState} from 'react'

// export default function App() {
//   const [uploadedPDF, setUploadedPDF] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const handlePDFUpload = async (e) => {
//     let file = e.target.files[0];
//     setUploading(true);
//     const urlResponse = await GetPDFUrl(file, 'folderName');
//     if (urlResponse?.type === 'success') {
//       setUploading(false);
//       setUploadedPDF(urlResponse.result);
//     } else {
//       setUploading(false);
//       //setErrorMessage(urlResponse.result) you can set error message here
//     }
//   };
  
  
//   return (
//     <div className="App">
//       <h1>PDF Upload</h1>
//       <input accept=".pdf" 
//         multiple={false}  
//         type="file"
//         onChange={handlePDFUpload}
//       />
          
//       {
//         uploading ? 
//         <p>Loading...</p> : 
//         <img src={uploadedPDF} alt="" />
//       }
//     </div>
//   )
// }