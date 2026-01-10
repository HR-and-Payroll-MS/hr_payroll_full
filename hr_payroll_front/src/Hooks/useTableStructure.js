export const table=
{
    Attendance:
    {
        bodyStructure:[3,1,2,1,1,2,1,1,1],
        headerStructure:[22,22,22,22,22,22,22,22,22],
    
    },
    Table:{
        bodyStructure:[3,1,1,2,2,62],
        headerStructure:[22,22,22,22,22,22,]
    },
    TeamAttendance:{
        bodyStructure:[4,1,1,1,51,1,61],
        headerStructure:[33,22,11,22,11,11,11]
    },
    Directory:{
        bodyStructure:[3,1,1,1,1,1,1],
        headerStructure:[11,11,11,11,11,11,11]
    },
    Dashboard:{
    bodyStructure: [4, 1, 1, 1, 52, 1, 61],
    headerStructure: [11, 11, 11, 11, 11, 11, 11],
  },
    
}
/* ..................for the user directory.....................
tabular fom..............

    pic.name.email 
    phone
    department
    gender
    status
    employment type/job_title
    recurring

card View ...............

    pic
    name
    employment type/job_title
    email
    phone
    status

*/ 



// {
//   "1": {
//     "expected": {
//       "time": "string"
//     },
//     "description": "Displays plain text (used for phone, department, gender, job title, or time)."
//   },

//   "2": {
//     "expected": {
//       "country": "string"
//     },
//     "description": "Displays country name with a location icon."
//   },

//   "3": {
//     "expected": {
//       "text": "string"
//     },
//     "description": "Reserved for custom text or numeric fields (not yet defined in switch)."
//   },

//   "4": {
//     "expected": {
//       "avatar": "string (image URL)",
//       "name": "string",
//       "email": "string"
//     },
//     "description": "Displays avatar, name, and email with a checkbox (used for user or employee columns)."
//   },

//   "11": {
//     "expected": {
//       "label": "string"
//     },
//     "description": "Header cell — displays dynamic label text like 'Job Title'."
//   },

//   "22": {
//     "expected": {
//       "label": "string"
//     },
//     "description": "Header cell — displays label text and a sort icon (e.g., 'Country')."
//   },

//   "33": {
//     "expected": {
//       "label": "string"
//     },
//     "description": "Header cell — checkbox + label (e.g., 'Employee Name')."
//   },

//   "51": {
//     "expected": {
//       "status": "string"
//     },
//     "description": "Displays plain status text (green background)."
//   },

//   "52": {
//     "expected": {
//       "status": "string ('Active' or 'Inactive')"
//     },
//     "description": "Displays colored status badge — green for Active, red for Inactive."
//   },

//   "61": {
//     "expected": {
//       "icon": "string (image URL)"
//     },
//     "description": "Displays a single icon (for actions like 'edit' or 'view')."
//   },

//   "62": {
//     "expected": {
//       "icons": [
//         { "icon": "string (image URL)" }
//       ]
//     },
//     "description": "Displays multiple icons side by side (e.g., edit + delete)."
//   }
// }
