


import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "../Context/ThemeContext";

export default function TextEditor({ value, onChange }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="custom-tinymce-wrapper">
      <Editor
        key={theme} // Still keep this for instant theme switching
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.0.1/tinymce.min.js"
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          min_height: 400,
          max_height: 500,
          menubar: false,
          plugins: "link lists image code table",
          toolbar: "undo redo | bold italic underline | bullist numlist | link image | table | code",
          branding: false,
          statusbar: false,
          resize: "both",
          elementpath: false,

          highlight_on_focus: true, // ← Key addition: removes default blue outline

          skin: isDark ? "oxide-dark" : "oxide",
          content_css: isDark ? "dark" : "default",

          content_style: `
            body { 
              font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              font-size: 14px; 
              padding: 12px; 
              line-height: 1.6; 
            }
          `,
        }}
      />
    </div>
  );
}
































// import { Editor } from "@tinymce/tinymce-react";
// import { useTheme } from "../Context/ThemeContext";

// export default function TextEditor({ value, onChange }) {
//   const { theme } = useTheme(); // "light" or "dark"

//   const isDark = theme === "dark";

//   return (
//     <div className="custom-tinymce-wrapper">
//       <Editor
//         key={theme} // ← This is the key fix: forces full re-init on theme change
//         tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.0.1/tinymce.min.js"
//         value={value}
//         onEditorChange={onChange}
//         init={{
//           height: 400,
//           min_height: 400,
//           max_height: 500,
//           menubar: false,
//           plugins: "link lists image code table",
//           toolbar:
//             "undo redo | bold italic underline | bullist numlist | link image | table | code",
//           branding: false,
//           statusbar: false,
//           resize: "both",
//           elementpath: false,

//           // Skin switches instantly because of the key
//           skin: isDark ? "oxide-dark" : "oxide",
//           content_css: isDark ? "dark" : "default",

//           content_style: `
//             body { 
//               font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
//               font-size: 14px; 
//               padding: 12px; 
//               line-height: 1.6; 
//             }
//           `,
//         }}
//       />
//     </div>
//   );
// }















// import { Editor } from "@tinymce/tinymce-react";

// export default function TextEditor({ value, onChange }) {
//   return (
//     <Editor
//       apiKey=""  // Leave empty—it's ignored when using tinymceScriptSrc
//       tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.0.1/tinymce.min.js"  // Free CDN (update to latest version if needed)
//       value={value}
//       onEditorChange={onChange}
//       init={{
//         min_height: 400,
//         outline:"Green",
// max_height: 500,

//         menubar: false,
//         // plugins: "link lists image code table autoresize",
//         plugins: "link lists image code table",
//         toolbar:
//           "undo redo | bold italic underline | bullist numlist | link image | table | code",
//         branding: false,
//         statusbar: false,
//         content_style:
//           "body { font-family: Inter, sans-serif; font-size:14px; padding:12px; }",
//       }}
//     />
//   );
// }