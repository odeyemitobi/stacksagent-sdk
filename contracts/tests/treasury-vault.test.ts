import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const VAULT = "treasury-vault-v2";

describe("treasury-vault-v2 tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("get-owner should return deployer", () => {
    const { result } = simnet.callReadOnlyFn(VAULT, "get-owner", [], deployer);
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("can deposit STX", () => {
    const amount = 1000n;
    const { result } = simnet.callPublicFn(VAULT, "deposit-stx", [Cl.uint(amount)], wallet1);
    expect(result).toBeOk(Cl.bool(true));

    const { result: balance } = simnet.callReadOnlyFn(VAULT, "get-balance", [], deployer);
    expect(balance).toBeOk(Cl.uint(amount));
  });

  it("fails to deposit 0 STX", () => {
    const { result } = simnet.callPublicFn(VAULT, "deposit-stx", [Cl.uint(0)], wallet1);
    expect(result).toBeErr(Cl.uint(400));
  });

  it("owner can transfer STX", () => {
    simnet.callPublicFn(VAULT, "deposit-stx", [Cl.uint(5000n)], wallet1);

    const { result } = simnet.callPublicFn(
      VAULT,
      "transfer-stx",
      [Cl.uint(1000n), Cl.principal(wallet2)],
      deployer,
    );
    expect(result).toBeOk(Cl.bool(true));

    const { result: balance } = simnet.callReadOnlyFn(VAULT, "get-balance", [], deployer);
    expect(balance).toBeOk(Cl.uint(4000n));
  });

  it("non-owner cannot transfer STX", () => {
    simnet.callPublicFn(VAULT, "deposit-stx", [Cl.uint(5000n)], wallet1);

    const { result } = simnet.callPublicFn(
      VAULT,
      "transfer-stx",
      [Cl.uint(1000n), Cl.principal(wallet2)],
      wallet1,
    );
    expect(result).toBeErr(Cl.uint(401));
  });

  it("can change owner", () => {
    const { result } = simnet.callPublicFn(VAULT, "set-owner", [Cl.principal(wallet1)], deployer);
    expect(result).toBeOk(Cl.bool(true));

    const { result: newOwner } = simnet.callReadOnlyFn(VAULT, "get-owner", [], deployer);
    expect(newOwner).toBeOk(Cl.principal(wallet1));
  });

  it("non-owner cannot change owner", () => {
    const { result } = simnet.callPublicFn(VAULT, "set-owner", [Cl.principal(wallet1)], wallet1);
    expect(result).toBeErr(Cl.uint(401));
  });
});
