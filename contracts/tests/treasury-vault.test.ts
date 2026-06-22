import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("treasury-vault tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("get-owner should return deployer", () => {
    const { result } = simnet.callReadOnlyFn("treasury-vault", "get-owner", [], deployer);
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("can deposit STX", () => {
    const amount = 1000n;
    const { result } = simnet.callPublicFn("treasury-vault", "deposit-stx", [Cl.uint(amount)], wallet1);
    expect(result).toBeOk(Cl.bool(true));

    const { result: balance } = simnet.callReadOnlyFn("treasury-vault", "get-balance", [], deployer);
    expect(balance).toBeOk(Cl.uint(amount));
  });

  it("fails to deposit 0 STX", () => {
    const { result } = simnet.callPublicFn("treasury-vault", "deposit-stx", [Cl.uint(0)], wallet1);
    expect(result).toBeErr(Cl.uint(400));
  });

  it("owner can transfer STX", () => {
    // First deposit
    simnet.callPublicFn("treasury-vault", "deposit-stx", [Cl.uint(5000n)], wallet1);

    // Transfer by deployer (owner)
    const { result } = simnet.callPublicFn(
      "treasury-vault",
      "transfer-stx",
      [Cl.uint(1000n), Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Balance should decrease
    const { result: balance } = simnet.callReadOnlyFn("treasury-vault", "get-balance", [], deployer);
    expect(balance).toBeOk(Cl.uint(4000n));
  });

  it("non-owner cannot transfer STX", () => {
    // First deposit
    simnet.callPublicFn("treasury-vault", "deposit-stx", [Cl.uint(5000n)], wallet1);

    // Transfer by wallet1 (not owner)
    const { result } = simnet.callPublicFn(
      "treasury-vault",
      "transfer-stx",
      [Cl.uint(1000n), Cl.principal(wallet2)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });

  it("can change owner", () => {
    const { result } = simnet.callPublicFn("treasury-vault", "set-owner", [Cl.principal(wallet1)], deployer);
    expect(result).toBeOk(Cl.bool(true));

    const { result: newOwner } = simnet.callReadOnlyFn("treasury-vault", "get-owner", [], deployer);
    expect(newOwner).toBeOk(Cl.principal(wallet1));
  });

  it("non-owner cannot change owner", () => {
    const { result } = simnet.callPublicFn("treasury-vault", "set-owner", [Cl.principal(wallet1)], wallet1);
    expect(result).toBeErr(Cl.uint(401));
  });
});
