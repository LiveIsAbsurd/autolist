import React from 'react';
import { useState } from 'react';
import { Select, Table } from 'antd';
import { MongoClient } from 'mongodb';
import styles from './index.module.sass'

const columns = [
    { title: 'ID', key: 'id', dataIndex: 'ID' },
    { title: 'Марка/модель', key: 'mark', dataIndex: 'mark' },
    { title: 'Модификация', key: 'mode', dataIndex: 'mode' },
    { title: 'Комплектация', key: 'equipment', dataIndex: 'equipment' },
    { title: 'Стоимость', key: 'price', dataIndex: 'price' }
]

export async function getServerSideProps() {
    const client = new MongoClient('mongodb://hrTest:hTy785JbnQ5@mongo0.maximum.expert:27423/?authSource=hrTest&replicaSet=ReplicaSet&readPreference=primary');
    await client.connect();

    const db = client.db('hrTest');
    const collection = db.collection('stock');
    const counts = await collection.aggregate([
        { $group: { _id: "$mark", count: { $sum: 1 } } }
    ]).toArray();
    const data = await collection.find({}).toArray();

    await client.close();

    return { props: { data: JSON.parse(JSON.stringify(data)), counts } }
}

const Index = ({ data, counts }) => {
    const [pageOption, setpageOption] = useState({ current: 1, pageSize: 10 });
    const [marksFilter, setMarksFilter] = useState(false);
    const [modelsFilter, setModelsFilter] = useState([]);

    let filtredData = data.filter((el) => {
        return marksFilter === el.mark || !marksFilter
    });

    const models = [];
    filtredData.forEach(el => {
        if (el.model && !models.includes(el.model)) {
            models.push(el.model);
        }
    });
    const modelsList = models.map(el => {
        return { value: el, label: el }
    })

    filtredData = filtredData.filter((el) => {
        return modelsFilter.includes(el.model) || modelsFilter.length == 0
    });

    const autoList = filtredData.map(el => {
        return {
            ID: el._id,
            mark: `${el.mark} ${el.model ? el.model : ''}`,
            key: el._id,
            mode: `${el.engine.volume.toFixed(1)} ${el.engine.transmission} (${el.engine.power} л.с.) ${el.drive}`,
            equipment: el.equipmentName,
            price: `${el.price.toLocaleString('ru-RU')} ₽`
        }
    });

    return (
        <div>
            <div>
                <div className={styles.marksList}>
                    {counts.map(el => {
                        return (
                            <div key={el._id}>
                                <button
                                    className={marksFilter === el._id ? styles.selected : null}
                                    onClick={() => {
                                        setMarksFilter((prev) => prev === el._id ? false : el._id)
                                        setModelsFilter([]);
                                    }}
                                >
                                    {el._id}
                                </button>
                                <span>{el.count}</span>
                            </div>
                        )
                    })}
                </div>
                <div style={{ marginBottom: '10px' }}>Модель:</div>
                <Select
                    mode="multiple"
                    style={{ width: '200px', marginBottom: '10px' }}
                    placeholder="Please select"
                    options={modelsList.map(el => {
                        return { label: el.label, value: el.value }
                    })}
                    value={modelsFilter}
                    onChange={(change) => {
                        setModelsFilter(change);
                    }}
                />

                <Table
                    columns={columns}
                    dataSource={autoList}
                    pagination={pageOption}
                    onChange={(pagination) => {
                        setpageOption(pagination);
                    }}
                />

            </div>
        </div>
    )
}

export default Index;