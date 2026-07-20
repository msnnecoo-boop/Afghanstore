// store.list() without { paginate: true } only returns the first page, so
// once a store grows past one page, older entries silently disappear from
// admin/customer listings with no error. This walks every page.
async function listAllBlobs(store) {
  const all = [];
  for await (const { blobs } of store.list({ paginate: true })) {
    all.push(...blobs);
  }
  return all;
}

module.exports = { listAllBlobs };
