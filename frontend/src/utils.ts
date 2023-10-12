import axios from "axios";

const API_URL =
  "https://pmnhw77jtbpsx5wgo5s2mboo4u0qkipq.lambda-url.eu-west-1.on.aws/";

export const getPresigned = async (file_type: string) => {
  const URL = API_URL + "?file=" + file_type;

  const { data } = await axios.get(URL);

  return data;
};

export const postData = async (files: Array<any>) => {
  let file_type = getFileType(files); // Get the file suffix
  let presigned = await getPresigned(file_type); // Get presigned URL for upload

  const object_key = presigned.fields.key;

  const file = files[0];

  const formData = new FormData();

  Object.entries(presigned.fields).forEach(([k, v]: any) => {
    formData.append(k, v);
  });

  formData.append("file", file); // The file has be the last element

  await axios.post(presigned.url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  let new_key = object_key.split(".")[0] + ".txt";
  return new_key;
};

const getFileType = (files: any) => {
  let split = files[0].name.split(".");
  let file_type = split[split.length - 1];

  return file_type;
};

export const getSummary = async (objectKey: string) => {
  try {
    const response = await axios.get(
      `https://medsum.demo.enpalm.se/summaries/${objectKey}`
    );
    return response;
  } catch (error: any) {
    //do nothing
  }
};
