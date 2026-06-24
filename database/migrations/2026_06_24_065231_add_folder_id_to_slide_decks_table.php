<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('slide_decks', function (Blueprint $table) {
            $table->foreignId('folder_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('slide_deck_folders')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('slide_decks', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
    }
};
