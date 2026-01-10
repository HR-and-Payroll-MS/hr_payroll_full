// utils/flattenObject.js

export function flattenObject(obj, parentKey = "", result = {}) {
  if (obj === null || typeof obj !== "object") return result;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}_${key}` : key;
    const value = obj[key];

    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === "object" && v !== null) {
          flattenObject(v, `${newKey}_${i}`, result);
        } else {
          result[`${newKey}_${i}`] = v;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}


// just pass it nested object (one argument only) and it will give you by concatinating them  with "_"

/* Example use case ___________
    const data = [
  {
    "id": "emp_001",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Sophia Johnson",
      "gender": "Female"
    },
    "contact": {
      "email": "sophia.johnson@example.com",
      "phone": "+1 (555) 321-8472"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Human Resources",
        "location": "Building A"
      },
      "job": {
        "title": "HR Manager",
        "level": "Senior"
      }
    }
  }]
    
  
    const obj = flattenObject(data[0])
    
    
    
    console.log(obj) === contact_email: "sophia.johnson@example.com"
                         contact_phone: "+1 (555) 321-8472"
                         employment_department_location: "Building A"
                         employment_department_name: "Human Resources"
                         employment_job_level: "Senior"
                         employment_job_title: "HR Manager"
                         employment_status:"Active"
                         id: "emp_001"
                         profile_full_name:"Sophia Johnson"
                         profile_gender: "Female"
                         profile_photo: "/pic/download (48).png"*/
