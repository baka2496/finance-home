from __future__ import annotations

import json
from typing import Any

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main as main_module
from app.database import AppSetting, Base


@pytest.fixture()
def isolated_session(monkeypatch: pytest.MonkeyPatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    monkeypatch.setattr(main_module, "SessionLocal", Session)
    return Session


def _run_with_exchange_result(monkeypatch: pytest.MonkeyPatch, exchange_result: dict[str, Any]) -> None:
    account = object()
    monkeypatch.setattr(main_module, "binance_connection_statuses", lambda db: [{"connected": True, "account_id": 2}])
    real_get = main_module.Session.get
    monkeypatch.setattr(
        main_module.Session, "get",
        lambda self, model, key, *args, **kwargs: account if model is main_module.Account else real_get(self, model, key, *args, **kwargs),
    )
    monkeypatch.setattr(main_module, "sync_binance_account", lambda db, acc, force=False: exchange_result)
    monkeypatch.setattr(main_module, "_should_refresh_fx", lambda db, now: False)
    monkeypatch.setattr(main_module, "refresh_market_prices", lambda db: {"updated": 0, "skipped": 0, "warnings": [], "errors": []})
    monkeypatch.setattr(main_module, "repair_linked_transfer_kinds", lambda db: {"updated": 0})
    monkeypatch.setattr(main_module, "repair_cross_source_card_duplicates", lambda db: {"removed": 0})
    monkeypatch.setattr(main_module, "gmail_status", lambda db: {"connected": False})
    monkeypatch.setattr(main_module, "record_valuation", lambda db: None)
    main_module.run_automatic_updates()


def _status(Session) -> tuple[str, dict[str, Any]]:
    with Session() as db:
        return db.get(AppSetting, "automation:last_status").value, json.loads(db.get(AppSetting, "automation:last_result").value)


def test_paused_exchange_is_not_reported_as_success(isolated_session, monkeypatch: pytest.MonkeyPatch):
    # 2026-11: Binance holdings were stale for four weeks while the page said "更新成功".
    _run_with_exchange_result(monkeypatch, {
        "updated": False, "skipped": True,
        "warnings": ["幣安限流暫停中，將於 2026/11/12 04:34 後自動重試"],
    })
    status, result = _status(isolated_session)
    assert status == "warning"
    assert result["exchanges_skipped"] == 1
    assert result["warnings"] == ["幣安限流暫停中，將於 2026/11/12 04:34 後自動重試"]


def test_updated_exchange_is_success(isolated_session, monkeypatch: pytest.MonkeyPatch):
    _run_with_exchange_result(monkeypatch, {"updated": True, "skipped": False, "warnings": []})
    status, result = _status(isolated_session)
    assert status == "success"
    assert result["exchanges_updated"] == 1
