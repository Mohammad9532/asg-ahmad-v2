<?php

namespace App\Policies;

use App\Models\Ledger;
use App\Models\User;

class LedgerPolicy
{
    public function view(User $user, Ledger $ledger): bool
    {
        return $user->isGlobal() || $user->shop_id === $ledger->shop_id;
    }
}
