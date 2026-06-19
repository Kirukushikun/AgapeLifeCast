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
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['image', 'video', 'audio']);
            $table->string('disk_path');
            $table->string('mime_type', 50);
            $table->string('extension', 10);
            $table->unsignedBigInteger('size')->default(0);      // bytes
            $table->unsignedSmallInteger('width')->nullable();   // px (image/video)
            $table->unsignedSmallInteger('height')->nullable();  // px (image/video)
            $table->unsignedInteger('duration_seconds')->nullable(); // video/audio
            $table->boolean('is_looping')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
