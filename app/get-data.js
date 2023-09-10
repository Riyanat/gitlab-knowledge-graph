import fetch from 'node-fetch';
import fs from 'fs';
import 'dotenv/config'

const BASE_URL = "https://gitlab.turntabl.net/api/v4/";
const PROJECT_URL= `${BASE_URL}/projects`;
const GROUPS_URL = `${BASE_URL}/groups`;


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
console.log(process.env.GITLAB_TOKEN);

const OPTIONS = {
          "headers": {
            "Authorization" : `Bearer ${process.env.GITLAB_TOKEN}`
            }
          };

// nodes and links
let nodes = {}
let links = []

let page = 1;
const PAGE_LIMIT = 100;

// get all projects
do {
    const projectsResponse = await fetch(PROJECT_URL + `?per_page=${PAGE_LIMIT}&page=${page}`, OPTIONS);
    const projects = await projectsResponse.json();

    // for each project, get all members
    for (let project of projects) {

        // get member information
        const membersUrl = PROJECT_URL + `/${project.id}/members`;
        const membersResponse = await fetch(membersUrl, OPTIONS);
        const members = await membersResponse.json();

        // add project object to node list.
        nodes[project.path_with_namespace] = {
            id: project.path_with_namespace,
            name: project.name,
            type: "project",
            group: project.namespace.full_path,
            count: members.length,
        }

        // create links
        for (const member of members) {
            if (!nodes[member.name]) {
             nodes[member.name] = {
                        id: member.name,
                        name: member.name,
                        type: "user",
                        group: "user",
                        count: 1
                       }
            } else {
               let existingCount = nodes[member.name].count;
                           nodes[member.name].count = existingCount + 1;
            }

            links.push({
                source: project.path_with_namespace,
                target: member.name,
                value: 1
            })
        }
    }
    page = projectsResponse.headers['x-next-page']
} while (page)

// write data to file
const graphData = {nodes: Object.values(nodes), links}
fs.writeFileSync('../viz/files/graph-data.json', JSON.stringify(graphData));
