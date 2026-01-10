// // import { Camera } from "lucide-react";
// // import { useEffect, useState } from "react";
// // import ImageUploader from "./ImageUploader";

// // export default function ProfilePicture() {
// //   const [image, setImage] = useState(null);
// //   const [open, setOpen] = useState(false); 
// // useEffect(()=>{
// //   const uploadImage = async () => {
// //   const formData = new FormData();

// //   if (typeof image === "string") {
// //     const file = base64ToFile(image, "profile.jpg");
// //     formData.append("image", file);
// //   } else {
// //     formData.append("image", image);
// //   }

// //   await axiosPrivate.post("/upload-image", formData, {
// //     headers: {
// //       "Content-Type": "multipart/form-data",
// //     },
// //   });
// // };
// // uploadImage();
// // },[image])
// //   return (
// //     <>
// //       <div className="relative rounded-full bg-amber-800 shadow w-28 h-28 ">
// //         {image?
// //           (<img src={image} className="w-28 bg-amber-100 h-28 rounded-full border-4 border-white shadow object-cover"/>
// //           ):(
// //           <div className='rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 text-center items-center flex justify-center w-28 text-4xl h-28 border-4 border-white shadow object-cover' >
// //                   {("Profile Picture" ?? "").split(" ").map(n => n[0]).slice(0, 2).join("") || "NA"}
// //           </div>)}
// //           <button onClick={() => setOpen(true)} className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow hover:bg-gray-100">
// //             <Camera size={18}/>
// //           </button>
// //       </div> {open && (
// //         <ImageUploader 
// //           setImage={setImage} 
// //           onClose={() => setOpen(false)}    // close modal from inside
// //         />
// //       )}
// //     </>
// //   );
// // }



// import { Camera } from "lucide-react";
// import { useEffect, useState } from "react";
// import ImageUploader from "./ImageUploader";
// import useAuth from "../../Context/AuthContext"; // adjust path if needed
// import { getLocalData } from "../../Hooks/useLocalStorage";

// // 🔹 helper: convert base64 → File
// const base64ToFile = (base64, filename) => {
//   const arr = base64.split(",");
//   const mime = arr[0].match(/:(.*?);/)[1];
//   const bstr = atob(arr[1]);
//   let n = bstr.length;
//   const u8arr = new Uint8Array(n);

//   while (n--) {
//     u8arr[n] = bstr.charCodeAt(n);
//   }

//   return new File([u8arr], filename, { type: mime });
// };

// export default function ProfilePicture({currentPhoto,setEmployeeData}) {
//   const { axiosPrivate } = useAuth();

//   const [image, setImage] = useState(null);
//   const [open, setOpen] = useState(false);

//   // 🔹 upload image when it changes
//   useEffect(() => {
//     if (!image) return; // ⛔ prevent upload on mount

//     const uploadImage = async () => {
//       try {
//         const formData = new FormData();

//         if (typeof image === "string") {
//           // base64
//           const file = base64ToFile(image, "profile.jpg");
//           formData.append("image", file);
//         } else {
//           // File object
//           formData.append("photo", image);
//         }

//         await axiosPrivate.patch(`/employees/${getLocalData("user_id")}/`, formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         });

//         console.log("✅ Image uploaded successfully");
//       } catch (error) {
//         console.error("❌ Image upload failed", error);
//       }
//     };

//     uploadImage();
//   }, [image, axiosPrivate]);

//   // const photos = formData.documents?.files;
// // console.log(photos)
// // if (photos) {
// // const photosArray = photos instanceof File ? [photos] : Array.from(photos);
// // photosArray.forEach(photo => {
// // uploadData.append("photo", photo);
// // });
// // }


//   return (
//     <>
//       <div className="relative rounded-full bg-amber-800 shadow w-28 h-28">
//         {image ? (
//           <img
//             src={typeof image === "string" ? image : URL.createObjectURL(image)}
//             className="w-28 h-28 rounded-full border-4 border-white shadow object-cover"
//             alt="Profile"
//           />
//         ) : (
//           <div className="rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 flex items-center justify-center w-28 h-28 text-4xl border-4 border-white shadow">
//             {("Profile Picture" ?? "")
//               .split(" ")
//               .map((n) => n[0])
//               .slice(0, 2)
//               .join("") || "NA"}
//           </div>
//         )}

//         <button
//           onClick={() => setOpen(true)}
//           className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow hover:bg-gray-100"
//         >
//           <Camera size={18} />
//         </button>
//       </div>

//       {open && (
//         <ImageUploader
//           setImage={setImage}
//           onClose={() => setOpen(false)}
//         />
//       )}
//     </>
//   );
// }
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import ImageUploader from "./ImageUploader";
import useAuth from "../../Context/AuthContext";
import { getLocalData } from "../../Hooks/useLocalStorage";
import { useTableContext } from "../../Context/TableContext";
import { useProfile } from "../../Context/ProfileContext";

const BASE_URL = import.meta.env.VITE_BASE_URL;
// 🔹 helper: convert base64 → File
const base64ToFile = (base64, filename) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
export default function ProfilePicture({ currentPhoto, setEmployeeData,userName="" }) {
  
  const { refreshProfile} = useProfile();
  const { axiosPrivate } = useAuth();
  const [image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
    const { refreshTableSilently } = useTableContext();
console.log("current photo",currentPhoto)
  // 🔹 upload image when it changes
  useEffect(() => {
    if (!image) return;

    const uploadImage = async () => {
      try {
        const formData = new FormData();
        if (typeof image === "string") {
          const file = base64ToFile(image, "profile.jpg");
          formData.append("photo", file); // Using "photo" as per your comments
        } else {
          formData.append("photo", image);
        }

        const response = await axiosPrivate.patch(`/employees/${getLocalData("user_id")}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        await refreshProfile();
        refreshTableSilently('users');
        
      
        // Update the parent state so the whole header and app knows about the new photo
        if (response.data) {
           setEmployeeData(response.data);
        }

        console.log("✅ Image uploaded and parent state updated");
      } catch (error) {
        console.error("❌ Image upload failed", error);
      }
    };

    uploadImage();
  }, [image, axiosPrivate, setEmployeeData]);

  // Determine what to display: New selection OR current DB photo
  const displayImage = image ? (typeof image === "string" ? image : URL.createObjectURL(image)) : (currentPhoto?`${BASE_URL}${currentPhoto}`:null);
  console.log("displayImage",userName)
 return (
  <>
    <div className="relative rounded-full shadow-lg w-28 h-28 group">
      {displayImage ? (
        <img 
          src={displayImage} 
          className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-700 shadow-md object-cover transition-colors"
        />
      ) : (
        <div className="rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 flex items-center justify-center w-28 h-28 text-4xl font-bold border-4 border-white dark:border-slate-700 shadow-md transition-colors">
          {(userName ?? "")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("") || "NA"}
        </div>
      )}

      {/* Edit Button - Styled to match your primary action buttons */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-1 right-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
      >
        <Camera size={16} />
      </button>
    </div>

    {/* Uploader Modal/Overlay */}
    {open && (
      <ImageUploader
        setImage={setImage}
        onClose={() => setOpen(false)}
      />
    )}
  </>
);
}