export const formSchemas = {
  // Schema for adding a new Tax Category
  taxCode: [
    { name: "code", label: "Tax Code", type: "text", required: true, placeholder: "e.g. PAYE" },
    { name: "description", label: "Description", type: "text", placeholder: "Pay As You Earn" },
  ],
  // Schema for adding a specific version to a tax code
  taxVersion: [
    { name: "versionName", label: "Version Name", type: "text", required: true, placeholder: "e.g. 2024 Standard" },
    { name: "percentage", label: "Tax Percentage (%)", type: "number", required: true },
    { name: "validFrom", label: "Valid From", type: "date", required: true },
    { name: "validTo", label: "Valid To", type: "date" },
    {
      name: "isActive",
      label: "Is Active?",
      type: "select",
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
  ],
};