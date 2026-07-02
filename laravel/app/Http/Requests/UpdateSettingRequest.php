<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'value' => 'nullable|string',
            'type' => 'sometimes|string|in:string,integer,decimal,boolean,json,text,file,encrypted',
            'group' => 'sometimes|string|max:50',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'sometimes|boolean',
        ];
    }
}
