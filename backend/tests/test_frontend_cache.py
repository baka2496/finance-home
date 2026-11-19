from app.main import spa_file_response


def test_html_is_revalidated_so_updates_show_up(tmp_path):
    page = tmp_path / "index.html"
    page.write_text("<!doctype html>", encoding="utf-8")
    assert spa_file_response(page).headers["cache-control"] == "no-cache"


def test_hashed_assets_keep_default_caching(tmp_path):
    asset = tmp_path / "index-abc123.js"
    asset.write_text("console.log(1)", encoding="utf-8")
    assert "cache-control" not in spa_file_response(asset).headers
