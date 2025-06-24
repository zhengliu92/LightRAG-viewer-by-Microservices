const base_url = process.env.NEXT_PUBLIC_BASE_URL;
const rag_url = process.env.NEXT_PUBLIC_RAG_URL;
const api_host = `${base_url}/v1`;
const user = `${api_host}/user`;
const role = `${api_host}/role`;
const file = `${api_host}/file`;
const kb = `${api_host}/kb`;
const kb_files = `${api_host}/kb/files`;
const project = `${api_host}/proj`;

export const api = {
  user: {
    login: {
      url: `${user}/login`,
      method: "post",
    },
    renew: {
      url: `${user}/renew`,
      method: "post",
    },
    logout: {
      url: `${user}/logout`,
      method: "post",
    },
    create: {
      url: `${user}/create`,
      method: "post",
    },
    update: {
      url: `${user}/update`,
      method: "patch",
    },
    activate: {
      url: `${user}/activate/{id}`,
      method: "patch",
    },
    deactivate: {
      url: `${user}/deactivate/{id}`,
      method: "patch",
    },
    getUserByID: {
      url: `${user}/{id}`,
      method: "get",
    },
    getUserByEmail: {
      url: `${user}/email/{email}`,
      method: "get",
    },
    get_me: {
      url: `${user}/get_me`,
      method: "post",
    },
  },
  role: {
    create: {
      url: `${role}/create`,
      method: "post",
    },
    list: {
      url: `${role}/list`,
      method: "get",
    },
    delete: {
      url: `${role}/delete/{role_name}`,
      method: "delete",
    },
  },
  file: {
    get_file_bytes: {
      url: `${file}/get_file_bytes`,
      method: "post",
    },
    list_bucket_files: {
      url: `${file}/list_bucket_files`,
      method: "get",
    },
    upload_files: {
      url: `${file}/upload_files`,
      method: "post",
    },
    upload_chunk: {
      url: `${file}/upload_chunk`,
      method: "post",
    },
    complete_upload: {
      url: `${file}/complete_upload`,
      method: "post",
    },
    delete_files: {
      url: `${file}/delete_files`,
      method: "post",
    },
    create_folder: {
      url: `${file}/new_folder_in_bucket`,
      method: "post",
    },
  },
  kb: {
    create_kb: {
      url: `${kb}`,
      method: "post",
    },
    get_user_kbs: {
      url: `${kb}/user`,
      method: "get",
    },
    change_kb_name: {
      url: `${kb}/{id}`,
      method: "patch",
    },
    delete_kb: {
      url: `${kb}/delete`,
      method: "post",
    },
    upsert_rag_config: {
      url: `${kb}/config`,
      method: "post",
    },
    get_rag_config_by_kb_id: {
      url: `${kb}/config/{kb_id}`,
      method: "get",
    },
    parse_and_build_kb: {
      url: `${kb}/parse_and_build`,
      method: "post",
    },
    query: {
      url: `${rag_url}/query/stream`,
      method: "post",
    },
    query_figures: {
      url: `${kb}/figures/query`,
      method: "post",
    },
    query_tables: {
      url: `${kb}/tables/query`,
      method: "post",
    },
    query_context: {
      url: `${kb}/context/query`,
      method: "post",
    },
    get_graph: {
      url: `${kb}/graph`,
      method: "post",
    },
  },
  kb_files: {
    create_kb_file: {
      url: `${kb_files}`,
      method: "post",
    },
    update_kb_file: {
      url: `${kb_files}/update`,
      method: "patch",
    },
    get_kbFiles_by_folder: {
      url: `${kb_files}/folder`,
      method: "post",
    },
    get_kbWithFiles_by_kbID: {
      url: `${kb_files}/kb/{kb_id}`,
      method: "get",
    },
    delete_kb_files: {
      url: `${kb_files}/delete`,
      method: "post",
    },
    remove_file_from_kb: {
      url: `${kb_files}/remove`,
      method: "post",
    },
    add_file_to_kb: {
      url: `${kb_files}/add`,
      method: "post",
    },
    start_parse_kb_file: {
      url: `${kb_files}/start_parse`,
      method: "post",
    },
    start_build_kb_file: {
      url: `${kb_files}/start_build`,
      method: "post",
    },
    stop_build_kb_file: {
      url: `${kb_files}/stop_build`,
      method: "post",
    },
  },
  file_asset: {
    get_file_assets: {
      url: `${kb_files}/assets/kb_file_id`,
      method: "post",
    },
  },
  proj: {
    user_projs_with_kbs: {
      url: `${project}/user`,
      method: "get",
    },
    list_projects: {
      url: `${project}/list`,
      method: "get",
    },
    delete_proj: {
      url: `${project}/delete`,
      method: "post",
    },
    rename_proj: {
      url: `${project}/rename`,
      method: "post",
    },
    create_proj: {
      url: `${project}/create`,
      method: "post",
    },
    add_user_to_proj: {
      url: `${project}/user/add`,
      method: "post",
    },
    remove_user_from_proj: {
      url: `${project}/user/remove`,
      method: "post",
    },
    get_project_with_users_kbs: {
      url: `${project}/get_project_with_users_and_kbs/{project_id}`,
      method: "get",
    },
    list_users_with_projects: {
      url: `${project}/list_users_with_projects`,
      method: "get",
    },
  },
};
