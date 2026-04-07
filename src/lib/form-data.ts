export function isFormDataFile(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value === "string") {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string" &&
    typeof value.arrayBuffer === "function"
  );
}

export function readFormDataFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return isFormDataFile(value) && value.size > 0 ? value : null;
}

export function getFormDataFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => isFormDataFile(value) && value.size > 0);
}
