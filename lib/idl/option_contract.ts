/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/option_contract.json`.
 */
export type OptionContract = {
  "address": "CcPMs3aDTLqphbwRLXd9tegpt3tw5rbhPjnCY6DTS26i",
  "metadata": {
    "name": "option_contract",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "add_custody",
      "discriminator": [
        247,
        254,
        126,
        17,
        26,
        6,
        215,
        117
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_token_mint"
              }
            ]
          }
        },
        {
          "name": "custody_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_token_mint"
              }
            ]
          }
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "custody_token_mint"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "AddCustodyParams"
            }
          }
        }
      ],
      "returns": "u8"
    },
    {
      "name": "add_liquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "funding_account",
          "writable": true
        },
        {
          "name": "lp_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lp_token_mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "custody_oracle_account"
        },
        {
          "name": "custody_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "lp_token_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool.name",
                "account": "Pool"
              }
            ]
          }
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "AddLiquidityParams"
            }
          }
        }
      ]
    },
    {
      "name": "add_pool",
      "discriminator": [
        115,
        230,
        212,
        211,
        175,
        49,
        39,
        169
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.name"
              }
            ]
          }
        },
        {
          "name": "lp_token_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.name"
              }
            ]
          }
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "AddPoolParams"
            }
          }
        }
      ],
      "returns": "u8"
    },
    {
      "name": "auto_exercise",
      "discriminator": [
        92,
        40,
        119,
        42,
        152,
        121,
        62,
        28
      ],
      "accounts": [
        {
          "name": "tester",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "user",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "params.user"
              }
            ]
          }
        },
        {
          "name": "option_detail",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "params.user"
              },
              {
                "kind": "arg",
                "path": "params.option_index"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody"
              }
            ]
          }
        },
        {
          "name": "locked_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "locked_custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "locked_oracle"
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "AutoExerciseOptionParams"
            }
          }
        }
      ]
    },
    {
      "name": "claim_option",
      "discriminator": [
        253,
        12,
        10,
        151,
        212,
        164,
        101,
        103
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "funding_account"
          ]
        },
        {
          "name": "funding_account",
          "writable": true
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "user",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "option_detail",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "params.option_index"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody"
              }
            ]
          }
        },
        {
          "name": "locked_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "locked_custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "locked_oracle"
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "ClaimOptionParams"
            }
          }
        }
      ]
    },
    {
      "name": "close_option",
      "discriminator": [
        138,
        79,
        53,
        54,
        221,
        16,
        109,
        141
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "funding_account"
          ]
        },
        {
          "name": "funding_account",
          "writable": true
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "user",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "pay_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "pay_custody_mint"
              }
            ]
          }
        },
        {
          "name": "pay_custody_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "pay_custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "locked_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "locked_custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "option_detail",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "params.option_index"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody"
              }
            ]
          }
        },
        {
          "name": "custody_oracle_account"
        },
        {
          "name": "pay_custody_oracle_account"
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "pay_custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "CloseOptionParams"
            }
          }
        }
      ]
    },
    {
      "name": "create_lp_mint",
      "discriminator": [
        240,
        207,
        70,
        86,
        85,
        222,
        161,
        55
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "lp_token_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.name"
              }
            ]
          }
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "LpTokenMintData"
            }
          }
        }
      ]
    },
    {
      "name": "exercise_option",
      "discriminator": [
        231,
        98,
        131,
        183,
        245,
        93,
        122,
        48
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "funding_account"
          ]
        },
        {
          "name": "funding_account",
          "writable": true
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "user",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "option_detail",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "params.option_index"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody"
              }
            ]
          }
        },
        {
          "name": "locked_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "locked_custody_mint"
              }
            ]
          }
        },
        {
          "name": "locked_oracle"
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "locked_custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "ExerciseOptionParams"
            }
          }
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "transfer_authority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "open_option",
      "discriminator": [
        237,
        33,
        198,
        81,
        110,
        234,
        251,
        210
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "funding_account",
          "writable": true
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "custody_oracle_account"
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "option_detail",
          "writable": true
        },
        {
          "name": "pay_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "pay_custody_mint"
              }
            ]
          }
        },
        {
          "name": "pay_custody_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "pay_custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "pay_custody_oracle_account"
        },
        {
          "name": "locked_custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "locked_custody_mint"
              }
            ]
          }
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "pay_custody_mint",
          "writable": true
        },
        {
          "name": "locked_custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "OpenOptionParams"
            }
          }
        }
      ]
    },
    {
      "name": "realloc_pool",
      "discriminator": [
        114,
        128,
        37,
        167,
        71,
        227,
        40,
        178
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "ReallocPoolParams"
            }
          }
        }
      ]
    },
    {
      "name": "remove_custody",
      "discriminator": [
        143,
        229,
        131,
        48,
        248,
        212,
        167,
        185
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_token_mint"
              }
            ]
          }
        },
        {
          "name": "custody_token_account",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_token_mint"
              }
            ]
          }
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "custody_token_mint"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "RemoveCustodyParams"
            }
          }
        }
      ],
      "returns": "u8"
    },
    {
      "name": "remove_liquidity",
      "discriminator": [
        80,
        85,
        209,
        72,
        24,
        206,
        177,
        108
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "receiving_account",
            "lp_token_account"
          ]
        },
        {
          "name": "receiving_account",
          "writable": true
        },
        {
          "name": "lp_token_account",
          "writable": true
        },
        {
          "name": "transfer_authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "custody",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody.mint",
                "account": "Custody"
              }
            ]
          }
        },
        {
          "name": "custody_oracle_account"
        },
        {
          "name": "custody_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  115,
                  116,
                  111,
                  100,
                  121,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "custody_mint"
              }
            ]
          }
        },
        {
          "name": "lp_token_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool.name",
                "account": "Pool"
              }
            ]
          }
        },
        {
          "name": "custody_mint",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "RemoveLiquidityParams"
            }
          }
        }
      ]
    },
    {
      "name": "remove_pool",
      "discriminator": [
        132,
        42,
        53,
        138,
        28,
        220,
        170,
        55
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "params.pool_name"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "RemovePoolParams"
            }
          }
        }
      ],
      "returns": "u8"
    },
    {
      "name": "set_signers",
      "discriminator": [
        16,
        210,
        170,
        26,
        155,
        87,
        127,
        49
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "SetAdminSignersParams"
            }
          }
        }
      ],
      "returns": "u8"
    }
  ],
  "accounts": [
    {
      "name": "Contract",
      "discriminator": [
        172,
        138,
        115,
        242,
        121,
        67,
        183,
        26
      ]
    },
    {
      "name": "Custody",
      "discriminator": [
        1,
        184,
        48,
        81,
        93,
        131,
        63,
        145
      ]
    },
    {
      "name": "Multisig",
      "discriminator": [
        224,
        116,
        121,
        186,
        68,
        161,
        79,
        236
      ]
    },
    {
      "name": "OptionDetail",
      "discriminator": [
        204,
        187,
        248,
        154,
        76,
        215,
        205,
        46
      ]
    },
    {
      "name": "Pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      "name": "User",
      "discriminator": [
        159,
        117,
        95,
        227,
        239,
        151,
        58,
        236
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidWithdrawError"
    },
    {
      "code": 6001,
      "name": "InvalidPoolBalanceError"
    },
    {
      "code": 6002,
      "name": "InvalidSignerBalanceError"
    },
    {
      "code": 6003,
      "name": "InvalidCustodyTokenError"
    },
    {
      "code": 6004,
      "name": "InvalidPoolState"
    },
    {
      "code": 6005,
      "name": "InvalidCustodyState"
    }
  ],
  "types": [
    {
      "name": "AddCustodyParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oracle",
            "type": "pubkey"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "AddLiquidityParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount_in",
            "type": "u64"
          },
          {
            "name": "min_lp_amount_out",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "AddPoolParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "AutoExerciseOptionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "option_index",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "ClaimOptionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "option_index",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CloseOptionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "option_index",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "Contract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pools",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "transfer_authority_bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Custody",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "token_account",
            "type": "pubkey"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "oracle",
            "type": "pubkey"
          },
          {
            "name": "token_owned",
            "type": "u64"
          },
          {
            "name": "token_locked",
            "type": "u64"
          },
          {
            "name": "fees",
            "type": {
              "defined": {
                "name": "Fees"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "token_account_bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ExerciseOptionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "option_index",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "Fees",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ratio_mult",
            "type": "u64"
          },
          {
            "name": "add_liquidity",
            "type": "u64"
          },
          {
            "name": "remove_liquidity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "LpTokenMintData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "Multisig",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "num_signers",
            "type": "u8"
          },
          {
            "name": "num_signed",
            "type": "u8"
          },
          {
            "name": "min_signatures",
            "type": "u8"
          },
          {
            "name": "instruction_accounts_len",
            "type": "u8"
          },
          {
            "name": "instruction_data_len",
            "type": "u16"
          },
          {
            "name": "instruction_hash",
            "type": "u64"
          },
          {
            "name": "signers",
            "type": {
              "array": [
                "pubkey",
                6
              ]
            }
          },
          {
            "name": "signed",
            "type": {
              "array": [
                "u8",
                6
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OpenOptionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "strike",
            "type": "f64"
          },
          {
            "name": "period",
            "type": "u64"
          },
          {
            "name": "expired_time",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "OptionDetail",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "quantity",
            "type": "u64"
          },
          {
            "name": "strike_price",
            "type": "f64"
          },
          {
            "name": "period",
            "type": "u64"
          },
          {
            "name": "expired_date",
            "type": "i64"
          },
          {
            "name": "purchase_date",
            "type": "u64"
          },
          {
            "name": "option_type",
            "type": "u8"
          },
          {
            "name": "premium",
            "type": "u64"
          },
          {
            "name": "premium_asset",
            "type": "pubkey"
          },
          {
            "name": "profit",
            "type": "u64"
          },
          {
            "name": "locked_asset",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "custody",
            "type": "pubkey"
          },
          {
            "name": "exercised",
            "type": "u64"
          },
          {
            "name": "bought_back",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "u64"
          },
          {
            "name": "valid",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "custodies",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "ratios",
            "type": {
              "vec": {
                "defined": {
                  "name": "TokenRatios"
                }
              }
            }
          },
          {
            "name": "aum_usd",
            "type": "u128"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lp_token_bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ReallocPoolParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ratios",
            "type": {
              "vec": {
                "defined": {
                  "name": "TokenRatios"
                }
              }
            }
          },
          {
            "name": "custody_key",
            "type": "pubkey"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "RemoveCustodyParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ratios",
            "type": {
              "vec": {
                "defined": {
                  "name": "TokenRatios"
                }
              }
            }
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "RemoveLiquidityParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lp_amount_in",
            "type": "u64"
          },
          {
            "name": "min_amount_out",
            "type": "u64"
          },
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "RemovePoolParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool_name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "SetAdminSignersParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "min_signatures",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "TokenRatios",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "target",
            "type": "u64"
          },
          {
            "name": "min",
            "type": "u64"
          },
          {
            "name": "max",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "User",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "option_index",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
}