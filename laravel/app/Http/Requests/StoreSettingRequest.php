<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handled by middleware/policy
    }

    public function rules(): array
    {
        return [
            'key' => 'required|string|max:255|unique:settings,key',
            'value' => 'nullable|string',
            'type' => 'required|string|in:string,integer,decimal,boolean,json,text,file,encrypted',
            'group' => 'required|string|max:50',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
        ];
    }
}
