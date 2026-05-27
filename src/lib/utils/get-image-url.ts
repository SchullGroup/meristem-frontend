// This is a utility function that push any file(images or video) to s3 and return a url that can be used to access the image anywhere. It accepts the file and folderName as parameters. The folderName is the name of the folder you want to upload to in s3.
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

// folder name must not have any symbols
export const GetImageUrl = async (file: File, folderName: string) => {
    const fileName = `${file?.name}`;
    const fileFormat = file?.type?.slice(6);
    const convertToUrlAPI = `https://4c73wdutl4.execute-api.us-west-1.amazonaws.com/staging/fileupload/upload-image?fileName=${fileName}&projectFolder=${folderName}&fileFormat=${fileFormat}`;

    if (file?.size > 2000000) {
        return { type: "error", result: "File too large..." };
    }

    const base64 = await convertToBase64(file);

    const payload = { file: base64 };
    try {
        const response = await axios.post(convertToUrlAPI, payload);
        return { type: "success", result: response.data.responseObj?.image_url };
    } catch (error) {
        return { type: "error", result: error };
    }
};

// SAMPLE USAGE OF THE FUNCTION IN A REACT CODE

// import { useState } from "react";

// export default function App() {
//   const [uploadedImage, setUploadedImage] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const handleImageUpload = async (e) => {
//     let file = e.target.files[0];
//     setUploading(true);
//     const urlResponse = await GetImageUrl(file, "folderName");
//     if (urlResponse?.type === "success") {
//       setUploading(false);
//       setUploadedImage(urlResponse.result);
//     } else {
//       setUploading(false);
//       //setErrorMessage(urlResponse.result) you can set error message here
//     }
//   };
//   return (
//     <div className="App">
//       <h1>Image Upload</h1>
//       <input
//         accept="image/*"
//         multiple={false}
//         type="file"
//         onChange={handleImageUpload}
//       />
//       {uploading ? <p>Loading...</p> : <img src={uploadedImage} alt="" />}
//     </div>
//   );
// }