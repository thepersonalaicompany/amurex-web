import { NextResponse } from 'next/server'
import PipelineSingleton from './pipeline.js';



export async function GET(request) {
    const text = request.nextUrl.searchParams.get('text');
    if (!text) {
        return NextResponse.json({
            error: 'Missing text parameter',
        }, { status: 400 });
    }
    // Get the classification pipeline. When called for the first time,
    // this will load the pipeline and cache it for future use.
    const embeddings = await PipelineSingleton.getInstance();

    // Actually perform the classification
    const result = await embeddings(text, {
        pooling: 'mean',
        normalize: true,
    });
    console.log(result.data)

    return NextResponse.json(Array.from(result.data));
}
